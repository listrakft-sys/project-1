'use client';

import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useTranslation } from '@/lib/i18n';

// ── Types ──────────────────────────────────────────────
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  feedback?: string | null;
}

interface AIConversation {
  id: string;
  type: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function AIAssistantPage() {
  const { t, user: authUser } = useAuthStore();
  const { t: tr } = useTranslation();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatType, setNewChatType] = useState('GENERAL');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const CHAT_TYPES = [
    { value: 'GENERAL', label: tr('ai.general') },
    { value: 'STUDENT_HELP', label: tr('ai.studentHelp') },
    { value: 'HOMEWORK_HELP', label: tr('ai.homeworkHelp') },
    { value: 'LESSON_EXPLAIN', label: tr('ai.lessonExplain') },
    { value: 'TEACHER_ASSIST', label: tr('ai.teacherAssist') },
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await apiClient.get('/ai/conversations');
      setConversations(res.data.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setError('');
      const res = await apiClient.get(`/ai/conversations/${id}`);
      setActiveConv(res.data.data);
      setMessages(res.data.data.messages || []);
    } catch (err) {
      setError('Error loading conversation');
    }
  };

  const createConversation = async () => {
    try {
      setCreating(true);
      setError('');
      const res = await apiClient.post('/ai/conversations', {
        type: newChatType,
        title: newChatTitle || 'New Chat',
      });
      const conv = res.data.data;
      setConversations([conv, ...conversations]);
      setActiveConv(conv);
      setMessages([]);
      setShowNewChat(false);
      setNewChatTitle('');
      loadConversations();
    } catch (err) {
      setError('Error creating conversation');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!activeConv) {
      setError(tr('ai.noConversations'));
      return;
    }

    const userMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, userMsg]);
    const sentInput = input;
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post(`/ai/conversations/${activeConv.id}/messages`, {
        content: sentInput,
      });

      const { aiMessage } = res.data.data;
      setMessages((prev) => [...prev, aiMessage]);
      loadConversations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error sending message');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await apiClient.delete(`/ai/conversations/${id}`);
      setConversations(conversations.filter((c) => c.id !== id));
      if (activeConv?.id === id) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Error deleting conversation');
    }
  };

  const provideFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    try {
      await apiClient.post(`/ai/messages/${messageId}/feedback`, { feedback });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
      );
    } catch (err) {
      console.error('Feedback failed', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* ── Sidebar: Conversations ───────────────────────── */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> {tr('ai.newChat')}
          </button>

          {showNewChat && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder={tr('ai.newChat')}
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <select
                value={newChatType}
                onChange={(e) => setNewChatType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {CHAT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                onClick={createConversation}
                disabled={creating}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50"
              >
                {creating ? '...' : tr('common.create')}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-8 px-4">
              {tr('ai.noConversations')}
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group p-3 rounded-xl cursor-pointer transition mb-1 ${
                  activeConv?.id === conv.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{conv.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {CHAT_TYPES.find((t) => t.value === conv.type)?.label || conv.type}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition ml-2"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm text-center">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{tr('ai.title')}</h2>
              <p className="text-gray-500">{tr('ai.description')}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {CHAT_TYPES.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => {
                      setNewChatType(t.value);
                      setShowNewChat(true);
                    }}
                    className="p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition text-left"
                  >
                    <p className="font-semibold text-sm text-gray-700">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <h1 className="font-bold text-gray-800">
                {activeConv.title}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {CHAT_TYPES.find((t) => t.value === activeConv.type)?.label}
                </span>
              </h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-12">
                  <p>👇</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    {msg.role === 'assistant' && !msg.id.startsWith('temp') && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => provideFeedback(msg.id, 'positive')}
                          className={`text-sm transition ${msg.feedback === 'positive' ? 'text-green-500' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                          👍
                        </button>
                        <button
                          onClick={() => provideFeedback(msg.id, 'negative')}
                          className={`text-sm transition ${msg.feedback === 'negative' ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                          👎
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={tr('ai.typeMessage')}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '➤'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {tr('ai.poweredBy')} · {authUser?.role}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
