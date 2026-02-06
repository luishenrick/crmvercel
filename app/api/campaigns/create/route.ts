import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { campaigns, campaignLeads } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, instanceId, scheduledAt, templateId, leads } = await request.json();

    const [newCampaign] = await db.insert(campaigns).values({
      teamId: team.id,
      instanceId: parseInt(instanceId),
      name,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      templateId: templateId ? parseInt(templateId) : null,
      status: 'DRAFT',
      totalLeads: leads.length
    }).returning();

    if (leads && leads.length > 0) {
      const leadsData = leads.map((lead: any) => ({
        campaignId: newCampaign.id,
        phone: lead.phone,
        variables: lead.variables || {},
        status: 'PENDING'
      }));
      
      
      await db.insert(campaignLeads).values(leadsData);
    }

    return NextResponse.json(newCampaign);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}