import React from 'react';
import { Zap, Filter, MessageSquare, User, Tag as TagIcon } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Badge } from '@/components/ui/badge';

interface StartNodeData {
  label: string;
  triggerType: string;
  keywords: string[];
  conditions?: {
    funnelStageId?: string;
    tagId?: string;
    assignedUserId?: string;
  };
}

export function StartNode({ data, selected }: { data: StartNodeData, selected?: boolean }) {
  const triggerTypeLabel = {
    exact_match: 'Exact Match',
    contains: 'Message Contains',
    first_message: 'First Message',
    fallback: 'Fallback (Default)'
  }[data.triggerType] || 'Message Contains';

  return (
    <BaseNode title="Start Trigger" icon={Zap} selected={selected} isStart>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <MessageSquare className="h-3 w-3" />
          <span className="font-medium">Type: {triggerTypeLabel}</span>
        </div>

        {data.keywords && data.keywords.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Keywords</span>
            <div className="flex flex-wrap gap-1">
              {data.keywords.slice(0, 3).map((k, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5">{k}</Badge>
              ))}
              {data.keywords.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1 h-5">+{data.keywords.length - 3}</Badge>
              )}
            </div>
          </div>
        )}

        {data.conditions && (Object.values(data.conditions).some(v => v) ) && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Conditions
            </span>
            <div className="flex flex-col gap-1">
              {data.conditions.funnelStageId && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Funnel Stage Filter
                </div>
              )}
              {data.conditions.tagId && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TagIcon className="h-3 w-3" /> Tag Filter
                </div>
              )}
              {data.conditions.assignedUserId && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <User className="h-3 w-3" /> Agent Filter
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}