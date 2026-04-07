import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const keysToRemove = [
      'facebook_token',
      'facebook_user_name',
      'facebook_user_picture',
      'facebook_connected',
    ];

    for (const key of keysToRemove) {
      await supabase.from('configuracoes').upsert(
        { chave: key, valor: '' },
        { onConflict: 'chave' }
      );
    }

    return NextResponse.json({ status: 'success', message: 'Desconectado com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
