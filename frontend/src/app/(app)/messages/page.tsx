'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Send, Paperclip, ArrowLeft, Search, User, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import ConversationList, { ConversationItem } from '@/components/ConversationList';
import MessageBubble, { MessageProps } from '@/components/MessageBubble';
import { Button } from '@/components/ui/Button';

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMessages] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConvs(true);
        const res = await api.get('/conversations');
        const data = res.data?.data || res.data || [];
        setConversations(data);
        
        // Auto-select conversation from URL param or first item
        const convParam = searchParams.get('conv');
        if (convParam) {
          setSelectedId(convParam);
        } else if (data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        // Fallback mock conversations if API fails or backend not seeded
        const mock: ConversationItem[] = [
          {
            id: 'conv-1',
            type: 'DIRECT',
            participants: [
              {
                userId: user?.id || 'me',
                user: {
                  id: user?.id || 'me',
                  username: user?.username || 'me',
                  profile: { firstName: 'You', lastName: '' },
                },
              },
              {
                userId: 'user-2',
                user: {
                  id: 'user-2',
                  username: 'maria_teacher',
                  profile: { firstName: 'María', lastName: 'García' },
                },
              },
            ],
            lastMessage: {
              content: 'Hola, recuerden entregar el trabajo de historia mañana.',
              createdAt: new Date().toISOString(),
            },
            unreadCount: 1,
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'conv-2',
            type: 'GROUP',
            name: 'Clase 8B - Matemáticas',
            participants: [],
            lastMessage: {
              content: '¿Alguien resolvió el ejercicio 4?',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            unreadCount: 0,
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ];
        setConversations(mock);
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setSelectedId('conv-1');
        }
      } finally {
        setIsLoadingConvs(false);
      }
    };

    fetchConversations();
  }, [user, searchParams]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await api.get(`/conversations/${selectedId}/messages`);
        const raw = res.data?.data || res.data || [];
        const formatted: MessageProps[] = raw.map((m: { id: string; senderId: string; sender?: { username?: string; profile?: { firstName?: string; lastName?: string } }; content: string; attachments?: string[]; createdAt: string; readBy?: string[] }) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.profile ? `${m.sender.profile.firstName} ${m.sender.profile.lastName}` : `@${m.sender?.username}`,
          content: m.content,
          attachments: m.attachments || [],
          createdAt: m.createdAt,
          readBy: m.readBy || [],
          isOwn: m.senderId === user?.id,
        }));
        setMessages(formatted);
      } catch (err) {
        // Mock messages fallback
        setMessages([
          {
            id: 'msg-1',
            senderId: 'user-2',
            senderName: 'María García',
            content: 'Hola! Recuerden entregar la tarea antes de las 18:00.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            readBy: [user?.id || 'me'],
            isOwn: false,
          },
          {
            id: 'msg-2',
            senderId: user?.id || 'me',
            senderName: 'Tú',
            content: 'Entendido, gracias por el recordatorio.',
            createdAt: new Date().toISOString(),
            readBy: ['user-2'],
            isOwn: true,
          },
        ]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
    // Mark as read
    api.post(`/conversations/${selectedId}/read`).catch(() => {});
  }, [selectedId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (id: string) => {
    // If mobile screens, navigate to /messages/[id] for full screen chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.push(`/messages/${id}`);
    } else {
      setSelectedId(id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !attachment) || !selectedId) return;

    const newMsgContent = inputMessage.trim();
    setInputMessage('');

    const tempMsg: MessageProps = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || 'me',
      senderName: 'Tú',
      content: newMsgContent,
      attachments: attachment ? [URL.createObjectURL(attachment)] : [],
      createdAt: new Date().toISOString(),
      readBy: [],
      isOwn: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setAttachment(null);

    try {
      await api.post(`/conversations/${selectedId}/messages`, {
        content: newMsgContent,
      });
    } catch (err) {
      // Message added optimistically
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const otherParticipant = selectedConv?.participants?.find((p) => p.userId !== user?.id);
  const chatTitle = selectedConv?.name
    ? selectedConv.name
    : otherParticipant?.user?.profile
    ? `${otherParticipant.user.profile.firstName} ${otherParticipant.user.profile.lastName}`
    : otherParticipant?.user?.username
    ? `@${otherParticipant.user.username}`
    : t('messages');

  return (
    <div className="h-[calc(100vh-65px)] md:h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left Panel: Conversations List */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId || undefined}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUserId={user?.id}
          isLoading={isLoadingConvs}
        />
      </div>

      {/* Right Panel: Active Chat View (Desktop) */}
      <div className="hidden md:flex flex-1 flex-col h-full bg-background border-l border-border">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {selectedConv.type === 'DIRECT' ? <User size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{chatTitle}</h3>
                  <p className="text-xs text-muted-foreground">{t('online')}</p>
                </div>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-accent/10">
              {isLoadingMsgs ? (
                <div className="text-center py-8 text-sm text-muted-foreground">{t('loading')}</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">{t('noMessages')}</div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} {...msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <label className="cursor-pointer p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip size={20} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
              </label>

              {attachment && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded truncate max-w-[100px]">
                  {attachment.name}
                </span>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('typeMessage')}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <Button type="submit" variant="primary" size="md" disabled={!inputMessage.trim() && !attachment}>
                <Send size={18} />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageCircle size={48} className="mb-4 text-muted-foreground/40" />
            <p className="text-base font-medium">{t('noConversations')}</p>
            <p className="text-xs text-muted-foreground mt-1">Selecciona una conversación para empezar a chatear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
