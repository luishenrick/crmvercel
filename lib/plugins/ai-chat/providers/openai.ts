import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, AIMessage, ToolDefinition } from '../types';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private systemPrompt?: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
    this.systemPrompt = config.systemPrompt;
  }

  async generateResponse(messages: AIMessage[], tools?: ToolDefinition[]): Promise<AIMessage> {
    const formattedTools: ChatCompletionTool[] | undefined = tools?.map(t => ({
      type: 'function' as const, 
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }
    }));

    const apiMessages: any[] = [...messages.map(m => {
        if (m.role === 'tool') {
            return {
                role: 'tool',
                tool_call_id: m.toolCallId,
                content: m.content
            };
        }
        return {
            role: m.role,
            content: m.content,
            tool_calls: m.toolCalls 
        };
    })];

    if (this.systemPrompt) {
        const hasSystem = apiMessages.some(m => m.role === 'system');
        if (!hasSystem) {
            apiMessages.unshift({ role: 'system', content: this.systemPrompt });
        }
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: apiMessages,
      tools: formattedTools && formattedTools.length > 0 ? formattedTools : undefined,
    });

    const choice = response.choices[0].message;

    return {
      role: 'assistant',
      content: choice.content,
      toolCalls: choice.tool_calls
    };
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const file = new File([blob], "audio.mp3", { type: blob.type });

        const transcription = await this.client.audio.transcriptions.create({
            file: file, 
            model: "whisper-1",
        });
        return transcription.text;
    } catch (e) {
        console.error("OpenAI Transcription Error:", e);
        throw e;
    }
  }
}