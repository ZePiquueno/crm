import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Buscar token e conta selecionada
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['facebook_token', 'facebook_connected', 'facebook_selected_account']);

    const token = configs?.find(c => c.chave === 'facebook_token')?.valor;
    const connected = configs?.find(c => c.chave === 'facebook_connected')?.valor;
    const selectedAccount = configs?.find(c => c.chave === 'facebook_selected_account')?.valor;

    if (!token || connected !== 'true') {
      return NextResponse.json({ status: 'error', message: 'Facebook não conectado.' }, { status: 401 });
    }

    if (!selectedAccount) {
      return NextResponse.json({ status: 'error', message: 'Nenhuma conta de anúncios selecionada.' }, { status: 400 });
    }

    let leadsProcessed = 0;
    let leadsAdded = 0;
    let leadsSkipped = 0;

    // Buscar formulários de lead da conta selecionada via anúncios
    // Primeiro busca os ads da conta
    let nextUrl: string | null = `https://graph.facebook.com/v19.0/${selectedAccount}/ads?fields=id,name,status&limit=100&access_token=${token}`;

    while (nextUrl) {
      const adsRes = await fetch(nextUrl);
      const adsData = await adsRes.json();

      if (!adsRes.ok || adsData.error) break;

      for (const ad of (adsData.data || [])) {
        // Buscar leads deste anúncio
        const leadsRes = await fetch(
          `https://graph.facebook.com/v19.0/${ad.id}/leads?fields=id,created_time,field_data,ad_name&limit=200&access_token=${token}`
        );

        if (!leadsRes.ok) continue;
        const leadsData = await leadsRes.json();

        for (const lead of (leadsData.data || [])) {
          leadsProcessed++;

          // Verificar se já existe
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('facebook_lead_id', lead.id)
            .maybeSingle();

          if (existing) {
            leadsSkipped++;
            continue;
          }

          // Mapear campos
          let nome = 'Lead Facebook';
          let email = '';
          let whatsapp = '';
          const camposExtras: Record<string, string> = {};

          (lead.field_data || []).forEach((field: any) => {
            const key = field.name.toLowerCase();
            const value = field.values?.[0] || '';

            if (key.includes('full_name') || key.includes('nome') || key === 'name') nome = value;
            else if (key.includes('email')) email = value;
            else if (key.includes('phone') || key.includes('whatsapp') || key.includes('telefone') || key.includes('celular')) whatsapp = value;
            else camposExtras[field.name] = value;
          });

          const { error } = await supabase.from('leads').insert({
            nome,
            email,
            whatsapp,
            facebook_lead_id: lead.id,
            origem_campanha: lead.ad_name || ad.name || 'Facebook Lead Ads',
            estagio: 'lead_novo',
            notas: Object.keys(camposExtras).length > 0
              ? Object.entries(camposExtras).map(([k, v]) => `${k}: ${v}`).join('\n')
              : null,
            created_at: lead.created_time || new Date().toISOString(),
          });

          if (!error) leadsAdded++;
        }
      }

      // Paginação
      nextUrl = adsData.paging?.next || null;
    }

    return NextResponse.json({
      status: 'success',
      message: `Sincronização concluída!`,
      stats: { leadsProcessed, leadsAdded, leadsSkipped }
    });

  } catch (err: any) {
    console.error('[leads-sync Error]', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
