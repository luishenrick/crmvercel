export interface AIProviderConfig {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  audioUrl?: string | null;
  toolCalls?: any[];
  toolCallId?: string;
}

export interface AIProvider {
  generateResponse(messages: AIMessage[], tools?: any[]): Promise<AIMessage>;
  transcribeAudio(audioUrl: string): Promise<string>;
}

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: any) => Promise<any>;
};