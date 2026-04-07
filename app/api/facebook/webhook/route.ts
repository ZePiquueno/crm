import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/facebook/webhook — verificação do webhook pela Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const webhookToken = process.env.FACEBOOK_WEBHOOK_TOKEN || 'crm_webhook_secret_2025';

  if (mode === 'subscribe' && token === webhookToken) {
    console.log('[Webhook] Verificação bem-sucedida!');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST /api/facebook/webhook — receber eventos de lead em tempo real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Webhook] Evento recebido:', JSON.stringify(body));

    // Processar apenas eventos de leadgen
    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ignored' });
    }

    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('chave', 'facebook_token');

    const token = configs?.find(c => c.chave === 'facebook_token')?.valor;
    if (!token) return NextResponse.json({ status: 'no_token' });

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;

        const leadId = change.value?.leadgen_id;
        if (!leadId) continue;

        // Verificar se lead já existe
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('facebook_lead_id', leadId)
          .maybeSingle();

        if (existing) continue;

        // Buscar dados completos do lead
        const leadRes = await fetch(
          `https://graph.facebook.com/v19.0/${leadId}?fields=id,created_time,field_data,ad_name,form_id&access_token=${token}`
        );
        const leadData = await leadRes.json();

        if (!leadRes.ok || leadData.error) {
          console.error('[Webhook] Erro ao buscar lead:', leadData.error?.message);
          continue;
        }

        // Mapear campos do formulário
        let nome = 'Lead Facebook';
        let email = '';
        let whatsapp = '';
        const camposExtras: Record<string, string> = {};

        (leadData.field_data || []).forEach((field: any) => {
          const key = field.name.toLowerCase();
          const value = field.values?.[0] || '';

          if (key.includes('full_name') || key.includes('nome') || key === 'name') nome = value;
          else if (key.includes('email')) email = value;
          else if (key.includes('phone') || key.includes('whatsapp') || key.includes('telefone') || key.includes('celular')) whatsapp = value;
          else camposExtras[field.name] = value;
        });

        await supabase.from('leads').insert({
          nome,
          email,
          whatsapp,
          facebook_lead_id: leadId,
          origem_campanha: leadData.ad_name || 'Facebook Lead Ads',
          estagio: 'lead_novo',
          notas: Object.keys(camposExtras).length > 0
            ? Object.entries(camposExtras).map(([k, v]) => `${k}: ${v}`).join('\n')
            : null,
          created_at: leadData.created_time || new Date().toISOString(),
        });

        console.log(`[Webhook] Lead salvo: ${nome} (${leadId})`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook Error]', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
