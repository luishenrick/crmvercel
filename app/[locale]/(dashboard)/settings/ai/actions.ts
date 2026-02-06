'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { aiConfigs } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type AiActionState = {
  error?: string;
  success?: string;
};

const aiConfigSchema = z.object({
  isActive: z.boolean(),
  provider: z.enum(['openai', 'gemini']),
  model: z.string().min(1),
  apiKey: z.string().min(1, "API Key is required"),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().min(1).optional(),
});

export async function getAiConfig() {
  const team = await getTeamForUser();
  if (!team) return null;

  const config = await db.query.aiConfigs.findFirst({
    where: eq(aiConfigs.teamId, team.id),
  });

  return config;
}

export async function saveAiConfig(prevState: AiActionState, formData: FormData): Promise<AiActionState> {
  const team = await getTeamForUser();
  if (!team) return { error: 'Unauthorized' };

  const rawData = {
    isActive: formData.get('isActive') === 'on',
    provider: formData.get('provider') as string,
    model: formData.get('model') as string,
    apiKey: formData.get('apiKey') as string,
    systemPrompt: formData.get('systemPrompt') as string,
    temperature: Number(formData.get('temperature')) || 0.7,
    maxOutputTokens: Number(formData.get('maxOutputTokens')) || 1000,
  };

  const validatedFields = aiConfigSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const dataToSave = {
    teamId: team.id,
    isActive: validatedFields.data.isActive,
    provider: validatedFields.data.provider,
    model: validatedFields.data.model,
    apiKey: validatedFields.data.apiKey,
    systemPrompt: validatedFields.data.systemPrompt,
    maxOutputTokens: validatedFields.data.maxOutputTokens,
    temperature: validatedFields.data.temperature?.toString() || '0.7',
    updatedAt: new Date(),
  };

  try {
    await db.insert(aiConfigs)
      .values(dataToSave)
      .onConflictDoUpdate({
        target: aiConfigs.teamId,
        set: dataToSave,
      });

    revalidatePath('/settings/ai');
    return { success: 'AI Configuration saved successfully.' };
  } catch (error) {
    console.error('Failed to save AI config:', error);
    return { error: 'Database error. Failed to save settings.' };
  }
}