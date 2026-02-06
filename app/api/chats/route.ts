import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teamMembers, chats } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTeamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
      columns: { teamId: true }
    });

    if (!userTeamMember) {
      return NextResponse.json({ error: 'User is not part of any team' }, { status: 404 });
    }

    const teamChats = await db.query.chats.findMany({
      where: eq(chats.teamId, userTeamMember.teamId),
      orderBy: [desc(chats.lastMessageTimestamp)],
      limit: 50,
      with: {
        contact: {
          columns: {
            id: true,
            name: true,
            notes: true,
            showTimeInStage: true,
          },
          with: {
            funnelStage: {
              columns: { id: true, name: true, order: true, emoji: true }
            },
            assignedUser: {
              columns: { id: true, name: true, email: true }
            },
            contactTags: {
              with: {
                tag: {
                  columns: { id: true, name: true, color: true }
                }
              }
            }
          }
        }
      }
    });

    const formattedChats = teamChats.map((chat) => {
      const contact = chat.contact;
      
      if (!contact) {
        return chat;
      }

      const formattedContact = {
        ...contact,
        tags: contact.contactTags.map((ct) => ct.tag),
      };
      
      // @ts-ignore
      delete formattedContact.contactTags;

      return {
        ...chat,
        contact: formattedContact
      };
    });

    return NextResponse.json(formattedChats);

  } catch (error: any) {
    console.error('Error fetching chats:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}