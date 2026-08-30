import { PrismaClient } from '@prisma/client';
// Use global fetch (Node 18+)

const prisma = new PrismaClient();

// NVIDIA NIM API configuration
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.GITHUB_TOKEN_2 || '';
const DEFAULT_MODEL = 'meta/llama-3.2-90b-vision-instruct';

// System prompts per role and chat type
const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  STUDENT_HELP: {
    STUDENT: `Eres un tutor educativo amigable y paciente. Tu trabajo es ayudar a estudiantes a entender conceptos,
      no a darles las respuestas directamente. Usa ejemplos, analogías y preguntas guía.
      Responde en el idioma del usuario. Si el estudiante pregunta sobre algo inapropiado, redirige la conversación
      hacia temas educativos. Mantén las respuestas concisas y claras.`,
    PARENT: `Eres un asistente que ayuda a padres a entender el progreso académico de sus hijos,
      explica el sistema escolar y da consejos sobre cómo apoyar el aprendizaje en casa.
      Responde en el idioma del usuario.`,
    TEACHER: `Eres un asistente para profesores que ayuda a crear material didáctico, planificar lecciones
      y generar ideas de evaluación. Responde en el idioma del usuario.`,
    SUPER_ADMIN: `Eres un asistente administrativo que ayuda con análisis de datos escolares,
      reportes y gestión. Responde en el idioma del usuario.`,
    SCHOOL_ADMIN: `Eres un asistente administrativo que ayuda con gestión escolar,
      programación y análisis. Responde en el idioma del usuario.`,
  },
  HOMEWORK_HELP: {
    STUDENT: `Eres un asistente de tareas. Guía al estudiante paso a paso sin dar la respuesta final.
      Pregunta sobre el contexto de la tarea, ayuda a entender los requisitos y sugiere enfoques.
      Responde en el idioma del usuario.`,
    TEACHER: `Eres un asistente que ayuda a profesores a crear, revisar y calificar tareas.
      Sugiere criterios de evaluación y feedback constructivo. Responde en el idioma del usuario.`,
  },
  LESSON_EXPLAIN: {
    STUDENT: `Eres un asistente que explica lecciones de manera clara y estructurada.
      Usa ejemplos visuales, analogías y desglosa conceptos complejos.
      Responde en el idioma del usuario.`,
    TEACHER: `Eres un asistente que ayuda a profesores a estructurar lecciones,
      crear materiales didácticos y sugerir actividades interactivas.
      Responde en el idioma del usuario.`,
  },
  TEACHER_ASSIST: {
    TEACHER: `Eres un asistente pedagógico. Ayudas a crear planes de lección, materiales didácticos,
      preguntas de examen y rúbricas de calificación. Responde en el idioma del usuario.`,
    SCHOOL_ADMIN: `Eres un asistente para administradores escolares. Ayudas con análisis de rendimiento,
      reportes, planificación de horarios y gestión de recursos. Responde en el idioma del usuario.`,
  },
  GENERAL: {
    STUDENT: `Eres un asistente educativo general. Ayudas con estudios, organización,
      técnicas de aprendizaje y preguntas generales. Responde en el idioma del usuario.`,
    TEACHER: `Eres un asistente general para profesores. Ayudas con pedagogía,
      organización de clases y recursos educativos. Responde en el idioma del usuario.`,
    PARENT: `Eres un asistente general para padres. Ayudas con educación familiar,
      comunicación con la escuela y apoyo académico. Responde en el idioma del usuario.`,
    SUPER_ADMIN: `Eres un asistente general. Ayudas con análisis, reportes y gestión del sistema escolar.
      Responde en el idioma del usuario.`,
    SCHOOL_ADMIN: `Eres un asistente general. Ayudas con gestión escolar y análisis.
      Responde en el idioma del usuario.`,
  },
};

const ANALYTICS_PROMPT = `Eres un analista de datos educativos. Analiza los datos proporcionados y genera:
  1. Resumen estadístico (promedios, tendencias, outliers)
  2. Insights clave (patrones, correlaciones)
  3. Recomendaciones accionables
  Formato: claro, estructurado, en el idioma del usuario.`;

export class AIService {
  /**
   * Get user's preferred language from DB
   */
  private static async getUserLang(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });
    return user?.preferredLang || 'es';
  }

  /**
   * Create a new AI conversation
   */
  static async createConversation(
    userId: string,
    type: string = 'GENERAL',
    title: string = 'New Chat',
    context?: Record<string, unknown>,
  ) {
    const validTypes = ['STUDENT_HELP', 'TEACHER_ASSIST', 'GENERAL', 'HOMEWORK_HELP', 'LESSON_EXPLAIN'];
    const chatType = validTypes.includes(type) ? type : 'GENERAL';

    return prisma.aIConversation.create({
      data: {
        userId,
        type: chatType as never,
        title,
        context: (context || undefined) as any,
      },
      include: { messages: true },
    });
  }

  /**
   * Get user's conversations (paginated)
   */
  static async getConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.aIConversation.count({ where: { userId } }),
    ]);

    return { conversations, total, page, limit };
  }

  /**
   * Get a single conversation with all messages
   */
  static async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      throw { statusCode: 404, errorCode: 'NOT_FOUND', message: 'Conversation not found' };
    }

    return conversation;
  }

  /**
   * Send a message and get AI response from NVIDIA NIM
   */
  static async sendMessage(
    conversationId: string,
    userId: string,
    userRole: string,
    content: string,
    preferredLang?: string,
  ) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
    });

    if (!conversation) {
      throw { statusCode: 404, errorCode: 'NOT_FOUND', message: 'Conversation not found' };
    }

    // Save user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'user',
        content,
      },
    });

    // Build system prompt based on role + chat type
    const systemPrompt =
      SYSTEM_PROMPTS[conversation.type]?.[userRole] ||
      SYSTEM_PROMPTS.GENERAL[userRole] ||
      SYSTEM_PROMPTS.GENERAL.STUDENT;

    // Build messages for NVIDIA API (OpenAI-compatible format)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Call NVIDIA NIM API
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI] NVIDIA API error:', response.status, errorText);
        throw {
          statusCode: 502,
          errorCode: 'AI_SERVICE_ERROR',
          message: 'AI service temporarily unavailable',
        };
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { total_tokens: number };
      };

      const aiContent = data.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
      const tokensUsed = data.usage?.total_tokens || 0;

      // Save AI response
      const aiMessage = await prisma.aIMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: aiContent,
          tokensUsed,
          modelUsed: DEFAULT_MODEL,
        },
      });

      // Auto-title conversation on first exchange
      if (conversation.messages.length === 0) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        await prisma.aIConversation.update({
          where: { id: conversationId },
          data: { title },
        });
      }

      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return { userMessage, aiMessage, tokensUsed };
    } catch (error: any) {
      if (error.statusCode) throw error;
      console.error('[AI] Request failed:', error.message);
      throw {
        statusCode: 503,
        errorCode: 'AI_CONNECTION_FAILED',
        message: 'Failed to connect to AI service',
      };
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw { statusCode: 404, errorCode: 'NOT_FOUND', message: 'Conversation not found' };
    }

    await prisma.aIConversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }

  /**
   * Provide feedback on an AI message (positive/negative)
   */
  static async provideFeedback(messageId: string, userId: string, feedback: string) {
    const message = await prisma.aIMessage.findFirst({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message || message.conversation.userId !== userId) {
      throw { statusCode: 404, errorCode: 'NOT_FOUND', message: 'Message not found' };
    }

    if (!['positive', 'negative'].includes(feedback)) {
      throw { statusCode: 400, errorCode: 'INVALID_FEEDBACK', message: 'Feedback must be positive or negative' };
    }

    return prisma.aIMessage.update({
      where: { id: messageId },
      data: { feedback },
    });
  }

  /**
   * Analyze text — for teachers/admins (summaries, sentiment, keywords, performance)
   */
  static async analyzeText(
    userId: string,
    _userRole: string,
    text: string,
    analysisType: 'summary' | 'sentiment' | 'keywords' | 'performance' = 'summary',
  ) {
    const analysisPrompts: Record<string, string> = {
      summary: 'Resume el siguiente texto de manera concisa, manteniendo los puntos clave:',
      sentiment: 'Analiza el sentimiento del siguiente texto (positivo, negativo, neutro) y explica por qué:',
      keywords: 'Extrae las 5-10 palabras clave más importantes del siguiente texto:',
      performance: `${ANALYTICS_PROMPT}\n\nAnaliza los siguientes datos de rendimiento estudiantil:`,
    };

    const messages = [
      { role: 'system', content: analysisPrompts[analysisType] || analysisPrompts.summary },
      { role: 'user', content: text },
    ];

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw { statusCode: 502, errorCode: 'AI_SERVICE_ERROR', message: 'AI analysis service unavailable' };
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
    };

    return {
      result: data.choices?.[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      analysisType,
    };
  }

  /**
   * Generate educational content — for teachers (quizzes, lesson plans, rubrics, etc.)
   */
  static async generateContent(
    userId: string,
    _userRole: string,
    contentType: 'quiz' | 'lesson_plan' | 'rubric' | 'summary' | 'flashcards',
    topic: string,
    level: string = 'general',
  ) {
    const contentPrompts: Record<string, string> = {
      quiz: `Genera un quiz de 5 preguntas sobre "${topic}" para nivel ${level}.
        Incluye 4 opciones múltiples y la respuesta correcta con explicación.`,
      lesson_plan: `Crea un plan de lección detallado para enseñar "${topic}" a nivel ${level}.
        Incluye objetivos, materiales, actividades, evaluación y tiempo estimado.`,
      rubric: `Crea una rúbrica de evaluación para "${topic}" nivel ${level}.
        Incluye criterios, niveles de desempeño y descriptores.`,
      summary: `Genera un resumen estructurado del tema "${topic}" para nivel ${level}.
        Incluye puntos clave, definiciones y ejemplos.`,
      flashcards: `Genera 10 flashcards sobre "${topic}" para nivel ${level}.
        Formato: Pregunta → Respuesta. Conciso y claro.`,
    };

    const messages = [
      { role: 'system', content: contentPrompts[contentType] || contentPrompts.summary },
      { role: 'user', content: `Tema: ${topic}\nNivel: ${level}` },
    ];

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.6,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw { statusCode: 502, errorCode: 'AI_SERVICE_ERROR', message: 'AI generation service unavailable' };
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
    };

    return {
      content: data.choices?.[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      contentType,
      topic,
    };
  }

  /**
   * Get AI usage statistics for a user
   */
  static async getUsageStats(userId: string) {
    const conversations = await prisma.aIConversation.count({ where: { userId } });
    const messages = await prisma.aIMessage.count({
      where: {
        conversation: { userId },
        role: 'user',
      },
    });
    const totalTokens = await prisma.aIMessage.aggregate({
      where: { conversation: { userId } },
      _sum: { tokensUsed: true },
    });
    const positiveFeedback = await prisma.aIMessage.count({
      where: { conversation: { userId }, feedback: 'positive' },
    });
    const negativeFeedback = await prisma.aIMessage.count({
      where: { conversation: { userId }, feedback: 'negative' },
    });

    return {
      conversations,
      messages,
      totalTokens: totalTokens._sum.tokensUsed || 0,
      feedback: { positive: positiveFeedback, negative: negativeFeedback },
    };
  }
}
