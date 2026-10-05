import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Health check usado pelo Docker (HEALTHCHECK) e por monitoramento externo. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check falhou', error);
    return NextResponse.json(
      { status: 'degraded', db: 'down', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
