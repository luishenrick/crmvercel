import { ToolDefinition } from './types';
import { db } from '@/lib/db/drizzle';
import { chats, aiTools, messages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher-server';

const BASE_URL =  process.env.BASE_URL || "http://localhost:3000";
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";

async function sendMediaToEvolution(
    instance: any, 
    remoteJid: string, 
    mediaUrl: string, 
    caption: string, 
    type: 'image' | 'document' | 'audio' | 'video',
    chatId: number, 
    teamId: number
) {
    if (!instance.accessToken) return { error: 'No access token' };

    const finalMediaUrl = mediaUrl.startsWith('http') 
        ? mediaUrl 
        : `${BASE_URL}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;

    const payload = {
        number: remoteJid.replace(/\D/g, ''),
        mediatype: type,
        mimetype: type === 'image' ? 'image/jpeg' : (type === 'audio' ? 'audio/mp3' : 'application/pdf'), 
        media: finalMediaUrl, 
        caption: caption,
        fileName: "file"
    };

    try {
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instance.instanceName}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'apikey': instance.accessToken
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        if (!response.ok) {
            console.error("Evolution API Error:", data);
            throw new Error(`Evolution API failed: ${response.status}`);
        }

        if (data?.key?.id) {
            const messageId = data.key.id;
            const timestamp = new Date(); 
            
            const newMessage = {
                id: messageId, 
                chatId: chatId, 
                fromMe: true, 
                messageType: `${type}Message`, 
                text: caption || "", 
                timestamp, 
                status: 'sent' as const, 
                isInternal: false,
                isAi: true,
                mediaUrl: finalMediaUrl,
                mediaMimetype: payload.mimetype,
                mediaCaption: caption,
            };

            await db.insert(messages).values(newMessage).onConflictDoNothing();

            const pusherChannel = `team-${teamId}`;
            await pusherServer.trigger(pusherChannel, 'new-message', { 
                ...newMessage,
                timestamp: timestamp.toISOString(),
                remoteJid, 
                instance: instance.instanceName,
            });
            
            await pusherServer.trigger(pusherChannel, 'chat-list-update', {
                id: chatId,
                lastMessageText: caption || "Media sent",
                lastMessageTimestamp: timestamp.toISOString(),
                lastMessageFromMe: true,
                remoteJid
            });
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("Error sending media:", error);
        return { success: false, error: error.message };
    }
}

const baseTools: ToolDefinition[] = [
  {
    name: 'handover_to_human',
    description: 'Transfers the conversation to a human agent and stops the AI.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for transfer' }
      }
    },
    execute: async (args, context) => {
       return { success: true, message: "Transferred to human" };
    }
  }
];

export async function getDynamicTools(teamId: number): Promise<ToolDefinition[]> {
    const dbTools = await db.query.aiTools.findMany({
        where: and(
            eq(aiTools.teamId, teamId),
            eq(aiTools.isActive, true)
        )
    });

    const dynamicTools: ToolDefinition[] = dbTools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: { type: 'object', properties: {} },
        execute: async (args, context) => {
            const chat = await db.query.chats.findFirst({
                where: eq(chats.id, context.chatId),
                with: { instance: true }
            });

            if (!chat || !chat.instance) return { success: false, message: "Instance not found" };

            await sendMediaToEvolution(
                chat.instance, 
                chat.remoteJid, 
                t.mediaUrl, 
                t.caption || '', 
                t.mediaType as any,
                context.chatId,
                teamId
            );

            const finalMessage = t.confirmationMessage && t.confirmationMessage.trim() !== '' 
                ? `[SYSTEM_INSTRUCTION] Output EXACTLY this text to the user: "${t.confirmationMessage}"`
                : `[SYSTEM_INSTRUCTION] Tell the user the ${t.name} was sent successfully.`;

            return { success: true, message: finalMessage };
        }
    }));

    return [...baseTools, ...dynamicTools];
}