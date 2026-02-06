import React from 'react';
import { Save } from 'lucide-react';
import { BaseNode } from './BaseNode';

interface SaveContactNodeData {
  nameVariable?: string;
  agentId?: string;
  tagId?: string;
  funnelStageId?: string;
}

export function SaveContactNode({ data, selected }: { data: SaveContactNodeData, selected?: boolean }) {
  const updates = [
    data.nameVariable ? `Name: {{${data.nameVariable}}}` : null,
    data.agentId && data.agentId !== 'null' ? 'Assign Agent' : null,
    data.tagId && data.tagId !== 'null' ? 'Add Tag' : null,
    data.funnelStageId && data.funnelStageId !== 'null' ? 'Move Stage' : null,
  ].filter(Boolean);

  return (
    <BaseNode title="Update Contact" icon={Save} selected={selected}>
      {updates.length > 0 ? (
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
          {updates.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      ) : (
        <span className="text-xs text-muted-foreground italic">No updates configured</span>
      )}
    </BaseNode>
  );
}