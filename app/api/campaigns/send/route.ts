import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { campaigns, campaignLeads, evolutionInstances, wabaTemplates } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaignId } = await request.json();

    const campaign = await db.query.campaigns.findFirst({
        where: and(eq(campaigns.id, parseInt(campaignId)), eq(campaigns.teamId, team.id)),
        with: {
            template: true,
            instance: true
        }
    });

    if (!campaign || !campaign.template || !campaign.instance) {
        return NextResponse.json({ error: 'Campaign invalid' }, { status: 404 });
    }

    const leads = await db.query.campaignLeads.findMany({
        where: and(eq(campaignLeads.campaignId, campaign.id), eq(campaignLeads.status, 'PENDING')),
        limit: 50
    });

    await db.update(campaigns).set({ status: 'PROCESSING' }).where(eq(campaigns.id, campaign.id));

    let sentCount = 0;
    let failedCount = 0;

    for (const lead of leads) {
        try {
            const dbComponents = campaign.template.components as any[];
            const payloadComponents = [];

            for (const comp of dbComponents) {
                if (comp.type === 'BODY') {
                    const params = [];
                    
                    if (lead.variables) {
                        const vars = lead.variables as Record<string, string>;
                        
                        const textMatch = comp.text.match(/\{\{(\d+)\}\}/g);
                        if (textMatch) {
                            const expectedCount = textMatch.length;
                            for (let i = 1; i <= expectedCount; i++) {
                                const val = vars[i.toString()] || vars[Object.keys(vars)[i-1]] || "";
                                params.push({ type: 'text', text: val });
                            }
                        }
                    }

                    if (params.length > 0) {
                        payloadComponents.push({
                            type: 'body',
                            parameters: params
                        });
                    }
                }
            }

            const metaPayload = {
                messaging_product: "whatsapp",
                to: lead.phone,
                type: "template",
                template: {
                    name: campaign.template.name,
                    language: { code: campaign.template.language },
                    components: payloadComponents.length > 0 ? payloadComponents : undefined
                }
            };

            const response = await fetch(
                `https://graph.facebook.com/v21.0/${campaign.instance.metaPhoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${campaign.instance.metaToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(metaPayload)
                }
            );

            if (response.ok) {
                await db.update(campaignLeads).set({ status: 'SENT' }).where(eq(campaignLeads.id, lead.id));
                sentCount++;
            } else {
                const err = await response.json();
                await db.update(campaignLeads).set({ status: 'FAILED', error: JSON.stringify(err) }).where(eq(campaignLeads.id, lead.id));
                failedCount++;
            }

            await new Promise(r => setTimeout(r, 100)); 

        } catch (e: any) {
            await db.update(campaignLeads).set({ status: 'FAILED', error: e.message }).where(eq(campaignLeads.id, lead.id));
            failedCount++;
        }
    }

    await db.update(campaigns).set({ 
        status: 'COMPLETED',
        sentCount: sql`${campaigns.sentCount} + ${sentCount}`,
        failedCount: sql`${campaigns.failedCount} + ${failedCount}`
    }).where(eq(campaigns.id, campaign.id));

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}