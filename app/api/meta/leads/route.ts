import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getMetaCredentials() {
  const { data: configs } = await supabase.from('configuracoes').select('*').in('chave', ['meta_token', 'ad_account']);
  
  let metaToken = (process.env.META_ACCESS_TOKEN || '').trim();
  let adAccountId = (process.env.META_AD_ACCOUNT_ID || '').trim();

  configs?.forEach((c) => {
    if (c.chave === 'meta_token' && c.valor) metaToken = c.valor.trim();
    if (c.chave === 'ad_account' && c.valor) adAccountId = c.valor.trim();
  });

  return { metaToken, adAccountId };
}

export async function GET() {
  try {
    const { metaToken, adAccountId } = await getMetaCredentials();

    if (!metaToken || !adAccountId) {
      return NextResponse.json({ status: 'error', message: 'Credenciais ausentes.' }, { status: 400 });
    }

    const formattedAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    // 1. Buscar formulários (Leadgen Forms) da conta de anúncios
    // Nota: Como não temos o Page ID, vamos buscar os anúncios ativos e seus formulários vinculados
    const adsUrl = `https://graph.facebook.com/v19.0/${formattedAdAccountId}/ads?fields=id,name,creative{id,child_attachments,object_story_spec}&limit=50&access_token=${metaToken}`;
    const adsResponse = await fetch(adsUrl);
    
    if (!adsResponse.ok) {
      const error = await adsResponse.json();
      throw new Error(error.error?.message || "Erro ao buscar anúncios.");
    }

    const adsData = await adsResponse.json();
    let leadsProcessed = 0;
    let leadsAdded = 0;

    // 2. Para cada anúncio, tentar buscar os leads gerados
    // Uma forma mais eficiente é buscar direto pela Ad Account usando o endpoint de leads se disponível, 
    // ou iterar sobre os Ads.
    for (const ad of adsData.data) {
      const leadsUrl = `https://graph.facebook.com/v19.0/${ad.id}/leads?fields=id,created_time,field_data,ad_name&limit=100&access_token=${metaToken}`;
      const leadsResponse = await fetch(leadsUrl);
      
      if (!leadsResponse.ok) continue; // Pula se der erro em um anúncio específico

      const leadsData = await leadsResponse.json();

      if (leadsData.data && leadsData.data.length > 0) {
        for (const lead of leadsData.data) {
          leadsProcessed++;
          
          // Mapear os campos do formulário (field_data)
          let nome = "Lead sem nome";
          let email = "";
          let whatsapp = "";
          
          lead.field_data.forEach((field: any) => {
            const name = field.name.toLowerCase();
            const value = field.values?.[0] || "";
            
            if (name.includes('full_name') || name.includes('nome') || name.includes('name')) nome = value;
            if (name.includes('email')) email = value;
            if (name.includes('phone') || name.includes('whatsapp') || name.includes('telefone')) whatsapp = value;
          });

          // 3. Salvar no Supabase (Deduplicar pelo facebook_lead_id)
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('facebook_lead_id', lead.id)
            .maybeSingle();

          if (!existingLead) {
            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                nome,
                email,
                whatsapp,
                facebook_lead_id: lead.id,
                origem_campanha: lead.ad_name || ad.name,
                estagio: 'lead_novo'
              });

            if (!insertError) leadsAdded++;
          }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Sincronização de contatos concluída.`,
      stats: {
        ads_checked: adsData.data.length,
        leads_processed: leadsProcessed,
        new_leads_added: leadsAdded
      }
    });

  } catch (error: any) {
    console.error("Erro na sync de leads:", error.message);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
