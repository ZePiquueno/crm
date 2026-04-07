import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const until = searchParams.get('until') || new Date().toISOString().split('T')[0];

    // Buscar token e conta selecionada do Supabase
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['facebook_token', 'facebook_connected', 'facebook_selected_account']);

    const tokenRow = configs?.find(c => c.chave === 'facebook_token');
    const connectedRow = configs?.find(c => c.chave === 'facebook_connected');
    const selectedAccount = configs?.find(c => c.chave === 'facebook_selected_account')?.valor;

    if (!tokenRow?.valor || connectedRow?.valor !== 'true') {
      return NextResponse.json({ status: 'not_connected' }, { status: 401 });
    }

    const token = tokenRow.valor;

    // 1. Buscar todas as contas de anúncios do usuário
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,amount_spent&limit=50&access_token=${token}`
    );
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok || accountsData.error) {
      throw new Error(accountsData.error?.message || 'Erro ao buscar contas de anúncios. Token pode ter expirado.');
    }

    const adAccounts = accountsData.data || [];

    // 2. Determinar qual conta usar
    let targetAccountId = selectedAccount;
    if (!targetAccountId && adAccounts.length > 0) {
      targetAccountId = adAccounts[0].id;
    }

    if (!targetAccountId) {
      return NextResponse.json({ status: 'success', adAccounts, campaigns: [], summary: null });
    }

    // 3. Buscar insights por campanha usando o endpoint correto
    const timeRange = JSON.stringify({ since, until });
    const insightsUrl = new URL(`https://graph.facebook.com/v19.0/${targetAccountId}/insights`);
    insightsUrl.searchParams.set('level', 'campaign');
    insightsUrl.searchParams.set('fields', 'campaign_id,campaign_name,spend,impressions,clicks,reach,actions,cpm,ctr');
    insightsUrl.searchParams.set('time_range', timeRange);
    insightsUrl.searchParams.set('limit', '100');
    insightsUrl.searchParams.set('access_token', token);

    const insightsRes = await fetch(insightsUrl.toString());
    const insightsData = await insightsRes.json();

    if (!insightsRes.ok || insightsData.error) {
      throw new Error(insightsData.error?.message || 'Erro ao buscar insights das campanhas.');
    }

    // 4. Buscar status das campanhas separadamente
    const campaignStatusRes = await fetch(
      `https://graph.facebook.com/v19.0/${targetAccountId}/campaigns?fields=id,name,status,objective&limit=100&access_token=${token}`
    );
    const campaignStatusData = await campaignStatusRes.json();
    const campaignStatusMap: Record<string, { status: string; objective: string }> = {};
    (campaignStatusData.data || []).forEach((c: any) => {
      campaignStatusMap[c.id] = { status: c.status, objective: c.objective };
    });

    const targetAccount = adAccounts.find((a: any) => a.id === targetAccountId);
    const allCampaigns: any[] = [];
    const summary = { spend: 0, impressions: 0, clicks: 0, leads: 0, reach: 0 };

    (insightsData.data || []).forEach((row: any) => {
      const leads = (row.actions || []).find((a: any) =>
        a.action_type === 'lead' ||
        a.action_type === 'onsite_conversion.lead_grouped' ||
        a.action_type === 'leadgen_grouped'
      )?.value || 0;

      const spend = parseFloat(row.spend || '0');
      const impressions = parseInt(row.impressions || '0');
      const clicks = parseInt(row.clicks || '0');
      const reach = parseInt(row.reach || '0');
      const leadsCount = parseInt(leads);
      const campaignInfo = campaignStatusMap[row.campaign_id] || { status: 'UNKNOWN', objective: '' };

      allCampaigns.push({
        id: row.campaign_id,
        name: row.campaign_name,
        status: campaignInfo.status,
        objective: campaignInfo.objective,
        account_name: targetAccount?.name || targetAccountId,
        spend,
        impressions,
        clicks,
        reach,
        leads: leadsCount,
        cpm: impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : '0',
        ctr: row.ctr ? parseFloat(row.ctr).toFixed(2) : (impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0'),
        cpl: leadsCount > 0 ? (spend / leadsCount).toFixed(2) : '0',
      });

      summary.spend += spend;
      summary.impressions += impressions;
      summary.clicks += clicks;
      summary.leads += leadsCount;
      summary.reach += reach;
    });

    // Ordenar por gasto decrescente
    allCampaigns.sort((a, b) => b.spend - a.spend);

    return NextResponse.json({
      status: 'success',
      adAccounts,
      selectedAccountId: targetAccountId,
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
