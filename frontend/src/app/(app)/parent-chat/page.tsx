'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import {
  MessageSquare,
  Users,
  Plus,
  X,
  Search,
  Send,
  ArrowLeft,
  User,
  GraduationCap,
  Heart,
  Mail,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────
interface ChildInfo {
  linkId: string;
  studentId: string;
  studentName: string;
  relationship: string | null;
  isPrimary: boolean;
  classId: string | null;
  className: string | null;
  homeroomTeacherId: string | null;
}

interface TeacherInfo {
  teacherId: string;
  userId: string;
  name: string;
  subjects: string[];
  isHomeroom: boolean;
}

interface ConversationInfo {
  id: string;
  name: string | null;
  type: string;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
  otherParticipant: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  };
}

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

// ── Main Page ─────────────────────────────────────────────
export default function ParentChatPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isParent = user?.role === 'PARENT';
  const isTeacher = user?.role === 'TEACHER';

  if (isParent) return <ParentView />;
  if (isTeacher) return <TeacherView />;
  return <div className="text-center py-12 text-muted-foreground">Access restricted to parents and teachers.</div>;
}

// ── Parent View ───────────────────────────────────────────
function ParentView() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'children' | 'teachers' | 'chats'>('chats');
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Selected conversation for chat view
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [childrenRes, teachersRes, convsRes] = await Promise.all([
        api.get('/parent-chat/children'),
        api.get('/parent-chat/teachers'),
        api.get('/parent-chat/conversations'),
      ]);
      setChildren(childrenRes.data?.data || []);
      setTeachers(teachersRes.data?.data || []);
      setConversations(convsRes.data?.data || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startChat = async (teacherUserId: string) => {
    try {
      const res = await api.post('/parent-chat/start', { teacherUserId });
      const conv = res.data?.data?.conversation;
      if (conv) {
        setSelectedConvId(conv.id);
        loadData();
      }
    } catch {
      // Silent
    }
  };

  // ── Chat detail view ──
  if (selectedConvId) {
    return (
      <ChatDetailView
        conversationId={selectedConvId}
        onBack={() => { setSelectedConvId(null); loadData(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            {t('nav.parentChat')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Chat with your children's teachers</p>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('nav.linkChild')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === 'chats'} onClick={() => setTab('chats')} icon={MessageSquare} label="Chats" count={conversations.length} />
        <TabButton active={tab === 'teachers'} onClick={() => setTab('teachers')} icon={GraduationCap} label={t('nav.teachers')} count={teachers.length} />
        <TabButton active={tab === 'children'} onClick={() => setTab('children')} icon={Heart} label={t('nav.myChildren')} count={children.length} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : tab === 'chats' ? (
        <ChatList conversations={conversations} onSelect={setSelectedConvId} />
      ) : tab === 'teachers' ? (
        <TeacherList teachers={teachers} onStartChat={startChat} />
      ) : (
        <ChildrenList children={children} />
      )}

      {/* Link child modal */}
      {showLinkModal && (
        <LinkChildModal onClose={() => setShowLinkModal(false)} onLinked={() => { setShowLinkModal(false); loadData(); }} />
      )}
    </div>
  );
}

// ── Teacher View ──────────────────────────────────────────
function TeacherView() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/parent-chat/conversations');
      setConversations(res.data?.data || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (selectedConvId) {
    return <ChatDetailView conversationId={selectedConvId} onBack={() => { setSelectedConvId(null); loadConversations(); }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          {t('nav.parentChat')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Conversations with parents</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : (
        <ChatList conversations={conversations} onSelect={setSelectedConvId} />
      )}
    </div>
  );
}

// ── Chat List ─────────────────────────────────────────────
function ChatList({ conversations, onSelect }: { conversations: ConversationInfo[]; onSelect: (id: string) => void }) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a chat with a teacher from the Teachers tab</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {conversations.map((conv, idx) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
            idx > 0 ? 'border-t border-border' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">{conv.otherParticipant?.name || conv.name || 'Unknown'}</p>
              {conv.lastMessage && (
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {new Date(conv.lastMessage.createdAt).toLocaleDateString('en', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {conv.lastMessage?.content || 'No messages yet'}
            </p>
          </div>
          {conv.unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Teacher List ──────────────────────────────────────────
function TeacherList({ teachers, onStartChat }: { teachers: TeacherInfo[]; onStartChat: (userId: string) => void }) {
  const { t } = useTranslation();

  if (teachers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t('nav.noTeachers')}</p>
        <p className="text-xs mt-1">Link a child first to see their teachers</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teachers.map(teacher => (
        <div key={teacher.teacherId} className="p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{teacher.name}</p>
                {teacher.isHomeroom && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">Homeroom</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{teacher.subjects.join(', ')}</p>
            </div>
          </div>
          <button
            onClick={() => onStartChat(teacher.userId)}
            className="mt-3 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t('nav.startChat')}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Children List ─────────────────────────────────────────
function ChildrenList({ children }: { children: ChildInfo[] }) {
  const { t } = useTranslation();

  if (children.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t('nav.noChildren')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children.map(child => (
        <div key={child.linkId} className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{child.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {child.className ? `Class ${child.className}` : 'No class'} · {child.relationship || 'Child'}
              </p>
            </div>
          </div>
          {child.isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
              <Heart className="h-3 w-3" /> Primary contact
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Chat Detail View ──────────────────────────────────────
function ChatDetailView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${conversationId}`),
          api.get(`/conversations/${conversationId}/messages`),
        ]);
        const convData = convRes.data?.data || convRes.data;
        setConversation(convData);
        const msgData = msgRes.data?.data || msgRes.data || [];
        setMessages(msgData.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.profile ? `${m.sender.profile.firstName} ${m.sender.profile.lastName}` : m.sender?.username || 'Unknown',
          content: m.content,
          createdAt: m.createdAt,
          isOwn: m.senderId === user?.id,
        })));
        // Mark as read
        api.post(`/conversations/${conversationId}/read`).catch(() => {});
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, { content: input.trim() });
      const newMsg = res.data?.data || res.data;
      setMessages(prev => [...prev, {
        id: newMsg.id,
        senderId: user!.id,
        senderName: 'You',
        content: input.trim(),
        createdAt: newMsg.createdAt || new Date().toISOString(),
        isOwn: true,
      }]);
      setInput('');
    } catch {
      // Silent
    } finally {
      setSending(false);
    }
  };

  const otherName = conversation?.participants?.find((p: any) => p.userId !== user?.id)?.user?.profile
    ? `${conversation.participants.find((p: any) => p.userId !== user?.id)?.user?.profile?.firstName} ${conversation.participants.find((p: any) => p.userId !== user?.id)?.user?.profile?.lastName}`
    : conversation?.participants?.find((p: any) => p.userId !== user?.id)?.user?.username || 'Chat';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card rounded-t-xl border border-b-0 border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{otherName}</p>
          <p className="text-xs text-muted-foreground">Parent–Teacher Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 border-x border-border">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Start the conversation — send a message below.</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                msg.isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card text-card-foreground border border-border rounded-bl-md'
              }`}>
                {!msg.isOwn && <p className="text-xs font-medium text-muted-foreground mb-0.5">{msg.senderName}</p>}
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-card rounded-b-xl border border-t-0 border-border flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2 rounded-full border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Link Child Modal ──────────────────────────────────────
function LinkChildModal({ onClose, onLinked }: { onClose: () => void; onLinked: () => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [relationship, setRelationship] = useState('');

  const searchStudents = async (query: string) => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/students', { params: { search: query } });
      setResults(res.data?.data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const linkStudent = async (studentId: string) => {
    setLinking(true);
    try {
      await api.post('/parent-chat/link', { studentId, relationship: relationship || undefined });
      onLinked();
    } catch {
      // Silent
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('nav.linkChild')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Relationship selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Relationship</label>
          <select
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Select…</option>
            <option value="mother">Mother</option>
            <option value="father">Father</option>
            <option value="guardian">Guardian</option>
            <option value="grandparent">Grandparent</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); searchStudents(e.target.value); }}
            placeholder="Search student by name…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {searching ? (
            <p className="text-sm text-muted-foreground text-center py-4">Searching…</p>
          ) : results.length === 0 && search.length >= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
          ) : (
            results.map(student => (
              <button
                key={student.id}
                onClick={() => linkStudent(student.id)}
                disabled={linking}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                  {student.user?.profile?.firstName?.[0] || student.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {student.user?.profile ? `${student.user.profile.firstName} ${student.user.profile.lastName}` : student.user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{student.class?.name || 'No class'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────
function TabButton({ active, onClick, icon: Icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
    </button>
  );
}
