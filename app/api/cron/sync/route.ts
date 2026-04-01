import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const domain = `${url.protocol}//${url.host}`;
    
    // Dispara a sincronização interna simulada
    const res = await fetch(`${domain}/api/meta/sync?cron=true`, { method: 'GET' });
    const data = await res.json();

    return NextResponse.json({
        cron_triggered: true,
        meta_sync_result: data
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
