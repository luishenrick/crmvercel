import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        // Simple query to check connection
        await db.execute(sql`SELECT 1`);
        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'healthy',
            latency: `${duration}ms`,
            database: 'connected',
            ssl: process.env.POSTGRES_URL?.includes('sslmode') || 'default'
        });
    } catch (error: any) {
        console.error('Health Check Failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            error: error.message,
            code: error.code,
            details: error.toString()
        }, { status: 500 });
    }
}
