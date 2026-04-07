import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/facebook?error=access_denied`);
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID!;
    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const redirectUri = `${appUrl}/api/facebook/callback`;

    // 1. Trocar code por short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Falha ao obter token do Facebook');
    }

    // 2. Trocar por long-lived token (válido por 60 dias)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    const finalToken = longTokenData.access_token || tokenData.access_token;

    // 3. Buscar dados do perfil do usuário
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.width(200)&access_token=${finalToken}`
    );
    const profileData = await profileRes.json();

    // 4. Salvar token e dados no Supabase
    await supabase.from('configuracoes').upsert(
      { chave: 'facebook_token', valor: finalToken },
      { onConflict: 'chave' }
    );
    await supabase.from('configuracoes').upsert(
      { chave: 'facebook_user_name', valor: profileData.name || '' },
      { onConflict: 'chave' }
    );
    await supabase.from('configuracoes').upsert(
      { chave: 'facebook_user_picture', valor: profileData.picture?.data?.url || '' },
      { onConflict: 'chave' }
    );
    await supabase.from('configuracoes').upsert(
      { chave: 'facebook_connected', valor: 'true' },
      { onConflict: 'chave' }
    );

    return NextResponse.redirect(`${appUrl}/facebook?success=true`);
  } catch (err: any) {
    console.error('[Facebook Callback Error]', err);
    return NextResponse.redirect(`${appUrl}/facebook?error=${encodeURIComponent(err.message)}`);
  }
}
