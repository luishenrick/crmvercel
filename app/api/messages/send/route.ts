import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, messages, evolutionInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatMessageForFrontend } from '@/lib/db/messages';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientJid, text, quotedMessageData, isInternal, instanceId } = body;

    if (!recipientJid || !text) {
      return NextResponse.json({ error: 'recipientJid and text are required' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isInternal) {
      let chatConditions = [
        eq(chats.teamId, team.id),
        eq(chats.remoteJid, recipientJid)
      ];

      if (instanceId) {
        chatConditions.push(eq(chats.instanceId, Number(instanceId)));
      }

      const chat = await db.query.chats.findFirst({
        where: and(...chatConditions),
        columns: { id: true }
      });

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }

      const internalId = `internal_${Date.now()}`;
      
      const internalMessageData = {
        id: internalId,
        chatId: chat.id,
        fromMe: true,
        messageType: 'conversation',
        text: text,
        timestamp: new Date(),
        status: 'read' as const,
        isInternal: true,
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        mediaFileLength: null,
        mediaSeconds: null,
        mediaIsPtt: null,
        quotedMessageId: null,
        quotedMessageText: null,
        contactName: null,
        contactVcard: null,
        locationLatitude: null,
        locationLongitude: null,
        locationName: null,
        locationAddress: null
      };

      await db.insert(messages).values(internalMessageData);

      return NextResponse.json(formatMessageForFrontend(internalMessageData));
    }

    let activeInstance = null;
    let targetChat = null;

    if (instanceId) {
        activeInstance = await db.query.evolutionInstances.findFirst({
            where: and(eq(evolutionInstances.id, Number(instanceId)), eq(evolutionInstances.teamId, team.id))
        });

        if (activeInstance) {
            targetChat = await db.query.chats.findFirst({
                where: and(
                    eq(chats.teamId, team.id),
                    eq(chats.remoteJid, recipientJid),
                    eq(chats.instanceId, activeInstance.id)
                )
            });
        }
    }

    if (!activeInstance) {
        targetChat = await db.query.chats.findFirst({
            where: and(
                eq(chats.teamId, team.id),
                eq(chats.remoteJid, recipientJid)
            ),
            with: {
                instance: true
            }
        });

        if (targetChat && targetChat.instance) {
            activeInstance = targetChat.instance;
        }
    }
    if (!activeInstance) {
        activeInstance = await db.query.evolutionInstances.findFirst({
            where: eq(evolutionInstances.teamId, team.id)
        });
    }

    if (!activeInstance || !activeInstance.instanceName || !activeInstance.accessToken) {
      return NextResponse.json({ error: 'Nenhuma instância conectada encontrada para enviar a mensagem.' }, { status: 404 });
    }

    const { instanceName, accessToken, id: dbInstanceId } = activeInstance;
    const evolutionPayload: any = {
      number: recipientJid,
      text: text,
    };

    if (quotedMessageData) {
      evolutionPayload.quoted = {
        key: { id: quotedMessageData.id },
        message: quotedMessageData.text ? { conversation: quotedMessageData.text } : undefined
      };
    }

    const evolutionResponse = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': accessToken,
        },
        body: JSON.stringify(evolutionPayload),
      }
    );

    const evolutionData = await evolutionResponse.json() as any;

    if (!evolutionResponse.ok) {
      console.error(`Evolution API Error for ${instanceName}:`, evolutionData);
      return NextResponse.json({ error: evolutionData.error || 'Failed to send message via Evolution API.' }, { status: evolutionResponse.status });
    }

    let savedMessage: any = null;
    await db.transaction(async (tx) => {
      let finalChatId = targetChat?.id;

      if (!finalChatId) {
         const [newChat] = await tx.insert(chats).values({
             teamId: team.id,
             remoteJid: recipientJid,
             instanceId: dbInstanceId,
             name: recipientJid.split('@')[0],
             lastMessageText: text,
             lastMessageTimestamp: new Date(),
             lastMessageFromMe: true,
             unreadCount: 0,
             lastMessageStatus: 'sent'
         }).returning({ id: chats.id });
         
         finalChatId = newChat.id;
      } else {
         await tx.update(chats)
            .set({
              lastMessageText: text,
              lastMessageTimestamp: new Date(),
              lastMessageFromMe: true,
              unreadCount: 0,
              lastMessageStatus: 'sent'
            })
            .where(eq(chats.id, finalChatId));
      }
      
      const messageContent = evolutionData.message?.extendedTextMessage || evolutionData.message;
      const messageText = messageContent?.text || evolutionData.message?.conversation || text;
      
      const dbQuotedMessageId = quotedMessageData?.id || null;
      const dbQuotedMessageText = quotedMessageData ? JSON.stringify(quotedMessageData) : null;

      const newMessageData = {
        id: evolutionData.key.id,
        chatId: finalChatId,
        fromMe: true,
        messageType: evolutionData.messageType || (messageContent?.text ? 'extendedTextMessage' : 'conversation'),
        text: messageText,
        timestamp: new Date(), 
        status: 'sent' as const,
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        mediaFileLength: null,
        mediaSeconds: null,
        mediaIsPtt: null,
        contactName: null,
        contactVcard: null,
        locationLatitude: null,
        locationLongitude: null,
        locationName: null,
        locationAddress: null,
        quotedMessageId: dbQuotedMessageId,
        quotedMessageText: dbQuotedMessageText,
        isInternal: false
      };

      const [insertedMessage] = await tx.insert(messages).values(newMessageData).onConflictDoNothing().returning();
      savedMessage = insertedMessage || newMessageData;
    });

    return NextResponse.json(formatMessageForFrontend(savedMessage || {}));

  } catch (error: any) {
    console.error('Error in /api/messages/send API:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}