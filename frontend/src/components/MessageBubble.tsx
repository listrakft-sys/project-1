'use client';

import React from 'react';
import { Check, CheckCheck, Paperclip, FileText } from 'lucide-react';

export interface MessageProps {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  attachments?: string[];
  createdAt: string | Date;
  readBy?: string[];
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageProps> = ({
  senderName,
  content,
  attachments = [],
  createdAt,
  readBy = [],
  isOwn,
}) => {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRead = readBy.length > 0;

  return (
    <div className={`flex flex-col my-1 max-w-[80%] md:max-w-[70%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {!isOwn && senderName && (
        <span className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
          {senderName}
        </span>
      )}

      <div
        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card border border-border text-card-foreground rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>

        {attachments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
            {attachments.map((fileUrl, idx) => (
              <a
                key={idx}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-xs underline font-medium hover:opacity-80 ${
                  isOwn ? 'text-primary-foreground' : 'text-primary'
                }`}
              >
                <Paperclip size={12} />
                <span className="truncate max-w-[200px]">
                  {fileUrl.split('/').pop() || `Archivo ${idx + 1}`}
                </span>
              </a>
            ))}
          </div>
        )}

        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
            isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}
        >
          <span>{formattedTime}</span>
          {isOwn && (
            <span>
              {isRead ? (
                <CheckCheck size={14} className="text-blue-300 inline" />
              ) : (
                <Check size={14} className="inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
