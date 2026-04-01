"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CalendarSync, Handshake, Target, TrendingUp, MonitorSmartphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FunnelChart, FunnelStageData } from "./components/FunnelChart";
import { EvolutionChart, EvolutionData } from "./components/EvolutionChart";
import { DateFilter } from "@/components/DateFilter";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Lead } from "@/lib/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({ 
    fechadas: 0, 
    faturamento: 0, 
    investido: 0, 
    leadsTotais: 0, 
    leadsMeta: 0,
    reunioes: 0, 
    funnelData: [] as FunnelStageData[],
    evolutionData: [] as EvolutionData[],
    isLoading: true 
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    const { data: leads, error } = await supabase.from('leads').select('*');
    
    if (leads && !error) {
      const { data: adsData } = await supabase.from('investimentos_ads').select('data, valor_gasto, leads_gerados');
      const investido = adsData ? adsData.reduce((acc, ad) => acc + (Number(ad.valor_gasto) || 0), 0) : 0;
      const leadsMeta = adsData ? adsData.reduce((acc, ad) => acc + (Number(ad.leads_gerados) || 0), 0) : 0;

      const estagiosOrdem: Record<string, number> = {
        "lead_novo": 1,
        "contato_feito": 2,
        "follow_up_1": 3,
        "follow_up_2": 3,
        "qualificado": 4,
        "reuniao_agendada": 5,
        "proposta_enviada": 6,
        "fechado_ganho": 7,
        "desqualificado": 0,
        "fechado_perdido": 0,
        "encerrado": 0
      };

      const countAtLeast = (level: number) => leads.filter(l => estagiosOrdem[l.estagio] >= level).length;
      
      const countL = leads.length;
      const countC = countAtLeast(2);
      const countF = countAtLeast(3);
      const countQ = countAtLeast(4);
      const countR = countAtLeast(5);
      const countP = countAtLeast(6);
      const countV = countAtLeast(7);

      const calcConv = (current: number, prev: number) => prev > 0 ? `${Math.round((current / prev) * 100)}%` : "0%";

      const funnelData: FunnelStageData[] = [
        { name: "Leads", count: countL, conversion: "100%" },
        { name: "Contatos", count: countC, conversion: calcConv(countC, countL) },
        { name: "Follow Ups", count: countF, conversion: calcConv(countF, countC) },
        { name: "Qualificados", count: countQ, conversion: calcConv(countQ, countF) },
        { name: "Reuniões", count: countR, conversion: calcConv(countR, countQ) },
        { name: "Propostas", count: countP, conversion: calcConv(countP, countR) },
        { name: "Vendas", count: countV, conversion: calcConv(countV, countP) },
      ];

      const dateMap: Record<string, { leads: number, investido: number }> = {};
      leads.forEach(l => {
        if (!l.created_at) return;
        const d = l.created_at.split('T')[0];
        if (!dateMap[d]) dateMap[d] = { leads: 0, investido: 0 };
        dateMap[d].leads += 1;
      });

      if (adsData) {
        adsData.forEach(ad => {
          if (!ad.data) return;
          const d = ad.data;
          if (!dateMap[d]) dateMap[d] = { leads: 0, investido: 0 };
          dateMap[d].investido += Number(ad.valor_gasto) || 0;
        });
      }

      const sortedDates = Object.keys(dateMap).sort();
      let accLeads = 0;
      let accInvestido = 0;
      
      const evolutionData: EvolutionData[] = sortedDates.map(dateStr => {
         accLeads += dateMap[dateStr].leads;
         accInvestido += dateMap[dateStr].investido;
         const [y, m, d] = dateStr.split('-');
         const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
         return {
           date: `${d} ${months[parseInt(m)-1]}`,
           leads: accLeads,
           investido: parseFloat(accInvestido.toFixed(2))
         };
      });

      if (evolutionData.length === 0) {
         const today = new Date();
         evolutionData.push({ date: `${today.getDate()} Mar`, leads: 0, investido: 0 });
      }

      const leadsFechados = leads.filter(l => l.estagio === "fechado_ganho");
      const faturamento = leadsFechados.reduce((acc, lead) => acc + (lead.valor_venda || 0), 0);
      
      setMetrics({ 
        fechadas: leadsFechados.length, 
        faturamento, 
        investido,
        leadsTotais: leads.length,
        leadsMeta,
        reunioes: countR,
        funnelData,
        evolutionData,
        isLoading: false 
      });
    } else {
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Sincronizando dados com o Meta Ads...");
    
    try {
      const resSync = await fetch('/api/meta/sync');
      const dataSync = await resSync.json();
      
      const resLeads = await fetch('/api/meta/leads');
      const dataLeads = await resLeads.json();

      if (dataSync.status === 'success' || dataLeads.status === 'success') {
        toast.success("Sincronização concluída!", {
          id: toastId,
          description: `${dataSync.ads_updated || 0} métricas e ${dataLeads.stats?.new_leads_added || 0} novos leads puxados.`
        });
        fetchDashboardData(); 
      } else {
        throw new Error("Erro na resposta da API");
      }
    } catch (error) {
      toast.error("Falha na sincronização", {
        id: toastId,
        description: "Verifique seu token da Meta nas configurações."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const ROI = metrics.investido > 0 ? ((metrics.faturamento / metrics.investido) * 100).toFixed(0) : 0;
  const CPL = metrics.leadsMeta > 0 ? (metrics.investido / metrics.leadsMeta) : 0;
  
  const faturamentoFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.faturamento);
  const investidoFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.investido);
  const cplFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(CPL);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-lg leading-relaxed">Visão geral de performance e métricas em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Meta"}
          </Button>
          <DateFilter />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-3">
        {/* Cards de Métricas */}
        <Card className="bg-card border border-border/60 overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Investido (Mês)</CardTitle>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-foreground tracking-tight">{metrics.isLoading ? "..." : investidoFormatado}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Gasto total no Facebook</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/60 overflow-hidden group hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Totais</CardTitle>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-foreground tracking-tight">{metrics.isLoading ? "..." : metrics.leadsTotais}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Capturados para o funil</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/60 overflow-hidden group hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo por Lead</CardTitle>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Target className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-amber-600 tracking-tight">{metrics.isLoading ? "..." : cplFormatado}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Investido / Total Leads</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/60 overflow-hidden group hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas Fechadas</CardTitle>
            <div className="p-2.5 bg-violet-50 rounded-lg text-violet-600">
              <Handshake className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-foreground tracking-tight">{metrics.isLoading ? "..." : metrics.fechadas}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Sessões agendadas: {metrics.reunioes}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-emerald-200/80 overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/8 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita Bruta</CardTitle>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-emerald-600 tracking-tight">{metrics.isLoading ? "..." : faturamentoFormatado}</div>
            <p className="text-[11px] text-emerald-600/60 mt-2 font-medium">Montante de contratos ganhos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-primary/20 overflow-hidden group hover:shadow-lg hover:shadow-primary/8 transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ROI Líquido</CardTitle>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-1">
            <div className="text-[28px] font-bold font-heading text-primary tracking-tight">{metrics.isLoading ? "..." : `${ROI}%`}</div>
            <p className="text-[11px] text-primary/60 mt-2 font-medium">Retorno sobre investimento</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <CardHeader className="px-6 pt-5 pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-primary" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-6">
          {!metrics.isLoading && metrics.funnelData.length > 0 ? (
            <FunnelChart data={metrics.funnelData} />
          ) : (
            <div className="h-[180px] w-full flex items-center justify-center text-muted-foreground animate-pulse">
              Calculando fluxos...
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/60 rounded-xl">
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução Mensal (Leads x Investimento)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-6 pt-2">
          <EvolutionChart data={metrics.evolutionData} />
        </CardContent>
      </Card>
    </div>
  );
}
