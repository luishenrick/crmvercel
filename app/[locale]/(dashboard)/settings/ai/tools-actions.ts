'use server';

import { db } from '@/lib/db/drizzle';
import { aiTools } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getAiTools() {
  const team = await getTeamForUser();
  if (!team) return [];

  return await db.query.aiTools.findMany({
    where: eq(aiTools.teamId, team.id),
    orderBy: (aiTools, { desc }) => [desc(aiTools.createdAt)],
  });
}

export async function createAiTool(formData: FormData) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const mediaUrl = formData.get('mediaUrl') as string;
  const mediaType = formData.get('mediaType') as string;
  const caption = formData.get('caption') as string;
  const confirmationMessage = formData.get('confirmationMessage') as string;

  
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  if (!cleanName || !description || !mediaUrl) {
    return { error: 'Missing required fields' };
  }

  try {
    await db.insert(aiTools).values({
      teamId: team.id,
      name: cleanName,
      description,
      mediaUrl,
      mediaType,
      caption,
      confirmationMessage,
      isActive: true,
    });

    revalidatePath('/settings/ai');
    return { success: 'Tool created successfully' };
  } catch (error: any) {
    if (error.code === '23505') {
        return { error: 'A tool with this name already exists.' };
    }
    return { error: 'Database error' };
  }
}

export async function deleteAiTool(id: number) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Unauthorized' };

  await db.delete(aiTools).where(and(eq(aiTools.id, id), eq(aiTools.teamId, team.id)));
  revalidatePath('/settings/ai');
  return { success: 'Tool deleted' };
}