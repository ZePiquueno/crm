import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const until = searchParams.get('until') || new Date().toISOString().split('T')[0];

    // Buscar token do Supabase
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['facebook_token', 'facebook_connected']);

    const tokenRow = configs?.find(c => c.chave === 'facebook_token');
    const connectedRow = configs?.find(c => c.chave === 'facebook_connected');

    if (!tokenRow?.valor || connectedRow?.valor !== 'true') {
      return NextResponse.json({ status: 'not_connected' }, { status: 401 });
    }

    const token = tokenRow.valor;

    // 1. Buscar contas de anúncios do usuário
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,amount_spent&access_token=${token}`
    );
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok || accountsData.error) {
      throw new Error(accountsData.error?.message || 'Erro ao buscar contas de anúncios');
    }

    const adAccounts = accountsData.data || [];
    const allCampaigns: any[] = [];
    const summary = { spend: 0, impressions: 0, clicks: 0, leads: 0, reach: 0 };

    // 2. Para cada conta, buscar campanhas + insights
    for (const account of adAccounts) {
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.id}/campaigns?fields=id,name,status,objective,insights.date_preset(lifetime){spend,impressions,clicks,reach,actions}&access_token=${token}&time_range={"since":"${since}","until":"${until}"}&limit=50`
      );
      const campaignsData = await campaignsRes.json();

      if (campaignsData.data) {
        for (const campaign of campaignsData.data) {
          const insights = campaign.insights?.data?.[0];
          const leads = insights?.actions?.find((a: any) =>
            a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
          )?.value || 0;

          const campaignObj = {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            account_name: account.name,
            spend: parseFloat(insights?.spend || '0'),
            impressions: parseInt(insights?.impressions || '0'),
            clicks: parseInt(insights?.clicks || '0'),
            reach: parseInt(insights?.reach || '0'),
            leads: parseInt(leads),
            cpm: insights?.impressions > 0
              ? ((parseFloat(insights?.spend || '0') / parseInt(insights?.impressions)) * 1000).toFixed(2)
              : '0',
            ctr: insights?.impressions > 0
              ? ((parseInt(insights?.clicks || '0') / parseInt(insights?.impressions)) * 100).toFixed(2)
              : '0',
            cpl: parseInt(leads) > 0
              ? (parseFloat(insights?.spend || '0') / parseInt(leads)).toFixed(2)
              : '0',
          };

          allCampaigns.push(campaignObj);
          summary.spend += campaignObj.spend;
          summary.impressions += campaignObj.impressions;
          summary.clicks += campaignObj.clicks;
          summary.leads += campaignObj.leads;
          summary.reach += campaignObj.reach;
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      adAccounts,
      campaigns: allCampaigns,
      summary: {
        ...summary,
        cpl: summary.leads > 0 ? (summary.spend / summary.leads).toFixed(2) : '0',
        ctr: summary.impressions > 0 ? ((summary.clicks / summary.impressions) * 100).toFixed(2) : '0',
        cpm: summary.impressions > 0 ? ((summary.spend / summary.impressions) * 1000).toFixed(2) : '0',
      }
    });

  } catch (err: any) {
    console.error('[Facebook Campaigns Error]', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
