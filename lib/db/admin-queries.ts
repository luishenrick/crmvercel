import { db } from '@/lib/db/drizzle';
import { users, teams, activityLogs, plans } from '@/lib/db/schema';
import { count, eq, desc, sql } from 'drizzle-orm';

// --- Dashboard Queries ---

export async function getAdminStats() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [teamCount] = await db.select({ count: count() }).from(teams);
  const [activeSubs] = await db
    .select({ count: count() })
    .from(teams)
    .where(eq(teams.subscriptionStatus, 'active'));

  return {
    users: userCount.count,
    teams: teamCount.count,
    activeSubscriptions: activeSubs.count,
  };
}

export async function getAllUsers() {
  return await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
}

export async function getAllTeams() {
  return await db
    .select({
      id: teams.id,
      name: teams.name,
      planName: teams.planName,
      subscriptionStatus: teams.subscriptionStatus,
      createdAt: teams.createdAt,
      memberCount: count(users.id),
    })
    .from(teams)
    .leftJoin(users, sql`${teams.id} = (SELECT team_id FROM team_members WHERE user_id = ${users.id} LIMIT 1)`)
    .groupBy(teams.id)
    .orderBy(desc(teams.createdAt))
    .limit(100);
}

export async function getRecentActivity() {
  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      user: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(20);
}

// --- Plans Queries (Novas) ---

export async function getAllPlans() {
  return await db.select().from(plans).orderBy(desc(plans.createdAt));
}

export async function getPlanById(id: number) {
  const result = await db.select().from(plans).where(eq(plans.id, id));
  return result[0] || null;
}