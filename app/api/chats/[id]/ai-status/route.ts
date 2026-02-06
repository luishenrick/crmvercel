import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { aiSessions, chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const chatId = parseInt(id);

    const session = await db.query.aiSessions.findFirst({
      where: and(
        eq(aiSessions.chatId, chatId),
        eq(aiSessions.status, 'active')
      )
    });

    return NextResponse.json({ isActive: !!session });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const chatId = parseInt(id);
    const { status } = await request.json(); // 'active' or 'paused'

    if (status !== 'active' && status !== 'paused') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existingSession = await db.query.aiSessions.findFirst({
        where: eq(aiSessions.chatId, chatId)
    });

    if (existingSession) {
        await db.update(aiSessions)
            .set({ status, updatedAt: new Date() })
            .where(eq(aiSessions.id, existingSession.id));
    } else if (status === 'active') {
        await db.insert(aiSessions).values({
            chatId,
            status: 'active',
            history: []
        });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}