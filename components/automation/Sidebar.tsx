import React from 'react';
import { MessageSquare, List, Clock, PenLine, Save, Image, XCircle, MousePointerClick, ListChecks, ExternalLink, Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Sidebar() {
  const t = useTranslations('Automation');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">{t('sidebar_title')}</h2>
        <p className="text-xs text-muted-foreground">{t('sidebar_desc')}</p>
      </div>
      
      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'message')} draggable>
          <div className="bg-primary/10 p-2 rounded-md">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium">{t('nodes.message')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'media')} draggable>
          <div className="bg-pink-500/10 p-2 rounded-md">
             <Image className="h-4 w-4 text-pink-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.media')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'button_message')} draggable>
          <div className="bg-indigo-500/10 p-2 rounded-md">
            <MousePointerClick className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.buttons')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'list_message')} draggable>
          <div className="bg-teal-500/10 p-2 rounded-md">
            <ListChecks className="h-4 w-4 text-teal-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.list')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'call_to_action')} draggable>
          <div className="bg-sky-500/10 p-2 rounded-md">
            <ExternalLink className="h-4 w-4 text-sky-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.cta')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'options')} draggable>
          <div className="bg-orange-500/10 p-2 rounded-md">
            <List className="h-4 w-4 text-orange-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.options')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'collect')} draggable>
          <div className="bg-purple-500/10 p-2 rounded-md">
            <PenLine className="h-4 w-4 text-purple-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.collect')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'save_contact')} draggable>
          <div className="bg-green-500/10 p-2 rounded-md">
            <Save className="h-4 w-4 text-green-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.save_contact')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'ai_control')} draggable>
          <div className="bg-violet-600/10 p-2 rounded-md">
             <Bot className="h-4 w-4 text-violet-600" />
          </div>
          <span className="text-sm font-medium">{t('nodes.ai_control')}</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'delay')} draggable>
          <div className="bg-blue-500/10 p-2 rounded-md">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-sm font-medium">{t('nodes.delay')}</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-destructive/50 cursor-grab active:cursor-grabbing transition-colors" onDragStart={(event) => onDragStart(event, 'end')} draggable>
          <div className="bg-destructive/10 p-2 rounded-md">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <span className="text-sm font-medium">{t('nodes.end')}</span>
        </div>
      </div>
    </aside>
  );
}