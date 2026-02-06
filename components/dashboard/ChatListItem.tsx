'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Smartphone, BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type Chat = {
  id: number;
  teamId: number;
  remoteJid: string;
  instanceId?: number;
  name: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  lastMessageText: string | null;
  lastMessageTimestamp: string | null;
  unreadCount: number | null;
  lastMessageStatus?: string | null;
  lastMessageFromMe?: boolean | null;
  contact?: {
    id: number;
    name: string;
    funnelStage?: { id: number; name: string; order: number; emoji?: string } | null;
    assignedUser?: { id: number; name: string; email: string } | null;
    tags?: { id: number; name: string; color: string }[];
  } | null;
};

type InstanceData = {
    dbId: number;
    instanceName: string;
    integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
};

function formatMessageTimestamp(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleDateString('en-US', { month: 'numeric', day: '2-digit' });
}

function ReadReceipt({ status }: { status?: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();

  if (s === 'read' || s === 'played') {
    return <CheckCheck className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (s === 'delivered' || s === 'delivery_ack') {
    return <CheckCheck className="h-4 w-4 text-gray-400 shrink-0" />;
  }
  if (s === 'sent') {
    return <Check className="h-4 w-4 text-gray-400 shrink-0" />;
  }
  
  return <Check className="h-4 w-4 text-gray-300 opacity-50 shrink-0" />;
}

interface ChatListItemProps { 
  chat: Chat; 
  isActive: boolean; 
  instances: InstanceData[];
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function ChatListItem({ 
  chat, 
  isActive, 
  instances, 
  isSelectionMode, 
  isSelected, 
  onSelect 
}: ChatListItemProps) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const displayName = chat.contact?.name || chat.name || chat.pushName || chat.remoteJid.split('@')[0];
  const time = formatMessageTimestamp(chat.lastMessageTimestamp);
  const lastMessageText = chat.lastMessageText || t('last_message_fallback');
  const unread = chat.unreadCount || 0;
  const chatNumber = chat.remoteJid.split('@')[0];
  
  const funnelName = chat.contact?.funnelStage?.name;
  const funnelEmoji = chat.contact?.funnelStage?.emoji;
  
  const chatInstance = instances?.find(i => i.dbId === chat.instanceId);
  const isWaba = chatInstance?.integration === 'WHATSAPP-BUSINESS';

  const formatPreviewText = (text: string) => {
    if (!text) return '';
    const singleLineText = text.replace(/\n/g, ' ');
    return <span className="text-muted-foreground">{singleLineText}</span>;
  };

  const handleClick = () => {
    if (isSelectionMode) {
      onSelect(chat.id);
    } else {
      const query = chat.instanceId ? `?instanceId=${chat.instanceId}` : '';
      router.push(`/dashboard/chat/${chatNumber}${query}`);
    }
  };

  return (
    <div className="w-full px-2 py-0.5">
      <div
        onClick={handleClick}
        className={`
          group relative flex items-start p-3 gap-3 cursor-pointer 
          rounded-xl border border-transparent transition-all duration-200 ease-in-out
          hover:bg-accent/50
          ${isActive || isSelected ? 'bg-accent/50' : 'bg-transparent'}
        `}
      >
        <div className="relative shrink-0 mt-1">
          <Avatar className="size-12 shadow-sm">
            <AvatarImage src={chat.profilePicUrl || ''} alt={displayName ?? undefined} className="object-cover" />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {displayName?.substring(0, 2).toUpperCase() || t('initials_fallback')}
            </AvatarFallback>
          </Avatar>
          
          <div 
            className={`absolute inset-0 flex items-center justify-center rounded-full z-20 transition-all duration-300 cursor-pointer
              ${isSelected ? 'bg-primary opacity-90' : 'bg-black/40 opacity-0 group-hover:opacity-100'}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(chat.id);
            }}
          >
             {isSelected ? (
               <Check className="h-6 w-6 text-primary-foreground animate-in zoom-in-50 duration-200" />
             ) : (
               <div className="h-5 w-5 border-2 border-white rounded-md" />
             )}
          </div>

          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm z-10">
              {isWaba ? (
                  <BadgeCheck className="h-4 w-4 text-blue-500 fill-white" />
              ) : (
                  <div className="bg-green-500 rounded-full h-4 w-4 flex items-center justify-center">
                      <Smartphone className="h-2.5 w-2.5 text-white" />
                  </div>
              )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex justify-between items-start">
            <span className="font-semibold truncate text-base text-foreground leading-tight" title={displayName}>
              {displayName}
            </span>
            <span className={`text-[11px] font-medium ${unread > 0 ? 'text-primary' : 'text-muted-foreground'} whitespace-nowrap ml-2`}>
              {time}
            </span>
          </div>

          <div className="flex justify-between items-center h-5">
            <div className="flex items-center gap-1.5 text-sm truncate flex-1">
              {chat.lastMessageFromMe !== undefined && chat.lastMessageFromMe !== null && (
                chat.lastMessageFromMe
                  ? <ReadReceipt status={chat.lastMessageStatus} />
                  : null 
              )}
              
              <span className="truncate block text-muted-foreground/90 text-[13px]">
                {formatPreviewText(lastMessageText)}
              </span>
            </div>

            {unread > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 ml-2 shadow-sm shrink-0">
                {unread > 99 ? t('unread_count_max') : unread}
              </span>
            )}
          </div>

          {funnelName && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
              <Badge 
                variant="secondary" 
                className="text-[10px] h-5 px-2 font-semibold rounded-sm bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border-0"
              >
                {funnelEmoji && <span className="mr-1.1 text-[11px]">{funnelEmoji}</span>}
                {funnelName}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="w-full px-2 py-0.5 space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center p-3 gap-3 rounded-xl border border-transparent bg-transparent">
          <div className="rounded-full bg-muted h-12 w-12 shrink-0 animate-pulse"></div>
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}