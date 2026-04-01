import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function syncMetaAds() {
  try {
    // Busca credenciais do Supabase
    const { data: configs } = await supabase.from('configuracoes').select('*').in('chave', ['meta_token', 'ad_account']);
    
    let metaToken = (process.env.META_ACCESS_TOKEN || '').trim();
    let adAccountId = (process.env.META_AD_ACCOUNT_ID || '').trim();
    let source = 'Vercel ENV';

    configs?.forEach((c) => {
      if (c.chave === 'meta_token' && c.valor) {
        metaToken = c.valor.trim();
        source = 'Supabase DB';
      }
      if (c.chave === 'ad_account' && c.valor) adAccountId = c.valor.trim();
    });

    console.log(`[Sync] Usando credenciais de: ${source}`);

    if (!metaToken || !adAccountId) {
      return NextResponse.json({ 
        status: 'warn', 
        message: 'Por favor, adicione o META_AD_ACCOUNT_ID e o Token nas Configurações para sincronizar.' 
      }, { status: 400 });
    }

    const formattedAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    // Busca os últimos 30 dias na Graph API
    const insightsUrl = `https://graph.facebook.com/v19.0/${formattedAdAccountId}/insights?date_preset=last_30d&time_increment=1&fields=campaign_id,campaign_name,impressions,clicks,spend,actions&access_token=${metaToken}`;
    
    const response = await fetch(insightsUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro de conexão com o Meta Ads.");
    }

    const data = await response.json();
    let adsUpdated = 0;

    if (data.data && data.data.length > 0) {
        for (const row of data.data) {
          const dateStart = row.date_start;
          let leadsCount = 0;

          if (row.actions && Array.isArray(row.actions)) {
            const leadAction = row.actions.find((a: any) => 
               a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped' || a.action_type === 'lead_grouped'
            );
            if (leadAction) {
              leadsCount = parseInt(leadAction.value) || 0;
            }
          }

          const { error: dbError } = await supabase
            .from('investimentos_ads')
            .upsert({
               data: dateStart,
               valor_gasto: parseFloat(row.spend) || 0,
               campanha_id: row.campaign_id,
               campanha_nome: row.campaign_name,
               impressoes: parseInt(row.impressions) || 0,
               cliques: parseInt(row.clicks) || 0,
               leads_gerados: leadsCount
            }, { onConflict: 'data, campanha_id' });
          
          if (dbError) {
            console.error("Erro ao salvar no Supabase:", dbError.message);
          } else {
            adsUpdated++;
          }
        }
    }

    return NextResponse.json({
      status: 'success',
      message: `Sincronização com o Meta Ads concluída. ${adsUpdated} registros diários atualizados.`,
      ads_updated: adsUpdated
    });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return syncMetaAds();
}

export async function POST() {
  return syncMetaAds();
}
