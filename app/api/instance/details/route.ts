import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries'; 
import { db } from '@/lib/db/drizzle'; 
import { evolutionInstances } from '@/lib/db/schema'; 
import { eq } from 'drizzle-orm';

const MASTER_API_KEY = process.env.AUTHENTICATION_API_KEY;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";

type InstanceDetailItem = {
    dbId: number;
    instanceName: string;
    evolutionInstanceId: string | null;
    number: string | null;
    integration: string | null;
    owner: string | null;
    profileName: string | null;
    profilePictureUrl: string | null;
    status: string;
    token: string | null;
};

export async function GET(request: Request) {
  try {
    if (!MASTER_API_KEY) {
        console.error("API Key master not configured on server.");
        throw new Error("Server configuration incomplete.");
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbInstances = await db.query.evolutionInstances.findMany({
      where: eq(evolutionInstances.teamId, team.id),
      orderBy: (instances, { asc }) => [asc(instances.instanceName)],
    });

    if (dbInstances.length === 0) {
      return NextResponse.json([]);
    }

    const instanceDetailsList: InstanceDetailItem[] = [];

    for (const dbInstance of dbInstances) {
        let status = 'unknown';
        let profileInfo: Partial<InstanceDetailItem> = { owner: null, profileName: null, profilePictureUrl: null };
        const apiKeyToUse = dbInstance.accessToken || MASTER_API_KEY;
        const identifier = dbInstance.evolutionInstanceId || dbInstance.instanceName;

        try {
            const stateResponse = await fetch(
              `${EVOLUTION_API_URL}/instance/connectionState/${dbInstance.instanceName}`, 
              { headers: { 'apikey': apiKeyToUse }, cache: 'no-store' }
            );

            if (stateResponse.ok) {
                const stateData = await stateResponse.json();
                status = stateData.instance?.state || 'unknown';

                if (status === 'open') {
                    const fetchParam = dbInstance.evolutionInstanceId
                        ? `instanceId=${identifier}`
                        : `instanceName=${identifier}`;

                    const detailsResponse = await fetch(
                      `${EVOLUTION_API_URL}/instance/fetchInstances?instanceId=${identifier}`,
                      { headers: { 'apikey': apiKeyToUse }, cache: 'no-store' }
                    );
                    if (detailsResponse.ok) {
                        const detailsArray = await detailsResponse.json();
                        if (detailsArray && detailsArray.length > 0) {
                            const evoInstance = detailsArray[0];
                            profileInfo = {
                                owner: evoInstance?.owner || null,
                                profileName: evoInstance?.profileName || null,
                                profilePictureUrl: evoInstance?.profilePicUrl || null,
                                number: evoInstance?.number || null,
                                integration: evoInstance?.integration || null,
                            };
                        }
                    }
                }
            } else if (stateResponse.status === 404) {
                 status = 'not_found';
            } else {
                status = 'error';
            }
        } catch (fetchError: any) {
            console.error(`Error fetching data for ${dbInstance.instanceName}: ${fetchError.message}`);
            status = 'error';
        }

        if (status !== 'not_found') {
            instanceDetailsList.push({
                dbId: dbInstance.id,
                instanceName: dbInstance.instanceName,
                evolutionInstanceId: dbInstance.evolutionInstanceId,
                status: status,
                token: dbInstance.accessToken,
                owner: profileInfo.owner ?? null, 
                profileName: profileInfo.profileName ?? null,
                number: profileInfo.number ?? null,
                integration: profileInfo.integration ?? null,
                profilePictureUrl: profileInfo.profilePictureUrl ?? null,
            });
        }
    }

    return NextResponse.json(instanceDetailsList);

  } catch (error: any) {
    console.error('Error fetching instance details:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}