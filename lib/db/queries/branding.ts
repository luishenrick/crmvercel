
import { db } from '@/lib/db/drizzle';

export async function getBranding() {
  try {
    return await db.query.branding.findFirst();
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    return null;
  }
}
