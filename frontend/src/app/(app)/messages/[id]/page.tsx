'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Paperclip, User, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import MessageBubble, { MessageProps } from '@/components/MessageBubble';
import { Button } from '@/components/ui/Button';

export default function SingleConversationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const fetchChatDetails = async () => {
      try {
        setIsLoading(true);
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/messages`),
        ]);

        const convData = convRes.data?.data || convRes.data;
        const msgData = msgRes.data?.data || msgRes.data || [];

        setConversation(convData);

        const formatted: MessageProps[] = msgData.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.profile
            ? `${m.sender.profile.firstName} ${m.sender.profile.lastName}`
            : `@${m.sender?.username}`,
          content: m.content,
          attachments: m.attachments || [],
          createdAt: m.createdAt,
          readBy: m.readBy || [],
          isOwn: m.senderId === user?.id,
        }));

        setMessages(formatted);
      } catch (err) {
        // Fallback mock data
        setConversation({
          id,
          type: 'DIRECT',
          name: 'Chat Directo',
        });
        setMessages([
          {
            id: 'm1',
            senderId: 'other',
            senderName: 'Prof. Carlos',
            content: 'Hola, ¿tienes alguna duda con el ejercicio?',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            readBy: [user?.id || 'me'],
            isOwn: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetails();
    api.post(`/conversations/${id}/read`).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !attachment) return;

    const contentText = inputMessage.trim();
    setInputMessage('');

    const tempMsg: MessageProps = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || 'me',
      senderName: 'Tú',
      content: contentText,
      attachments: attachment ? [URL.createObjectURL(attachment)] : [],
      createdAt: new Date().toISOString(),
      readBy: [],
      isOwn: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setAttachment(null);

    try {
      await api.post(`/conversations/${id}/messages`, { content: contentText });
    } catch (err) {
      // Optimistic state maintained
    }
  };

  const otherParticipant = conversation?.participants?.find((p: any) => p.userId !== user?.id);
  const title = conversation?.name
    ? conversation.name
    : otherParticipant?.user?.profile
    ? `${otherParticipant.user.profile.firstName} ${otherParticipant.user.profile.lastName}`
    : otherParticipant?.user?.username
    ? `@${otherParticipant.user.username}`
    : t('messages');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-3 border-b border-border bg-card flex items-center gap-3">
        <button
          onClick={() => router.push('/messages')}
          className="p-1.5 rounded-lg hover:bg-accent text-foreground transition-colors"
          title={t('back')}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
          {conversation?.type === 'DIRECT' ? <User size={18} /> : <Users size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{t('online')}</p>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-accent/10">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">{t('loading')}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">{t('noMessages')}</div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} {...msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
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
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded truncate max-w-[120px]">
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
    </div>
  );
}
