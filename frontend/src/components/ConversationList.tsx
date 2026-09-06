'use client';

import React from 'react';
import { User, Users, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface Participant {
  userId: string;
  user: {
    id: string;
    username: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

export interface ConversationItem {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'CLASS' | 'PARENT_TEACHER';
  name?: string;
  avatar?: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    createdAt: string | Date;
  };
  unreadCount?: number;
  updatedAt: string | Date;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  currentUserId,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const getConversationTitle = (conv: ConversationItem) => {
    if (conv.name) return conv.name;
    if (conv.type === 'DIRECT' && currentUserId) {
      const other = conv.participants.find((p) => p.userId !== currentUserId);
      if (other?.user?.profile) {
        return `${other.user.profile.firstName} ${other.user.profile.lastName}`;
      }
      return other?.user?.username ? `@${other.user.username}` : t('messages');
    }
    return conv.type;
  };

  const getConversationAvatar = (conv: ConversationItem) => {
    if (conv.avatar) return conv.avatar;
    if (conv.type === 'DIRECT' && currentUserId) {
      const other = conv.participants.find((p) => p.userId !== currentUserId);
      return other?.user?.profile?.avatar;
    }
    return null;
  };

  const filtered = conversations.filter((conv) => {
    const title = getConversationTitle(conv).toLowerCase();
    const lastMsg = conv.lastMessage?.content?.toLowerCase() || '';
    return title.includes(searchQuery.toLowerCase()) || lastMsg.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Search Header */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchConversations')}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">{t('noConversations')}</div>
        ) : (
          filtered.map((conv) => {
            const title = getConversationTitle(conv);
            const avatar = getConversationAvatar(conv);
            const active = conv.id === selectedId;
            const timeStr = conv.lastMessage?.createdAt
              ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors hover:bg-accent/50 ${
                  active ? 'bg-accent' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={title}
                      className="w-11 h-11 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {conv.type === 'DIRECT' ? <User size={20} /> : <Users size={20} />}
                    </div>
                  )}
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1 border-2 border-card">
                      {conv.unreadCount}
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeStr}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage?.content || t('noMessages')}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
