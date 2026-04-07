import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/facebook/accounts — salva conta selecionada
export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    if (!accountId) return NextResponse.json({ status: 'error', message: 'accountId obrigatório' }, { status: 400 });

    await supabase.from('configuracoes').upsert(
      { chave: 'facebook_selected_account', valor: accountId },
      { onConflict: 'chave' }
    );

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
