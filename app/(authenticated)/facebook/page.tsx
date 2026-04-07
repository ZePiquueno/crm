"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter } from "@/components/DateFilter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  LogOut,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
} from "lucide-react";

// Ícone do Facebook
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  account_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  leads: number;
  cpm: string;
  ctr: string;
  cpl: string;
}

interface Summary {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  reach: number;
  cpl: string;
  ctr: string;
  cpm: string;
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const NUM = new Intl.NumberFormat("pt-BR");

function FacebookPageInner() {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPicture, setUserPicture] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Checar status de conexão ao montar
  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    const { data: configs } = await supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", ["facebook_connected", "facebook_user_name", "facebook_user_picture"]);

    const connected = configs?.find((c) => c.chave === "facebook_connected")?.valor === "true";
    const name = configs?.find((c) => c.chave === "facebook_user_name")?.valor || "";
    const picture = configs?.find((c) => c.chave === "facebook_user_picture")?.valor || "";

    setIsConnected(connected);
    setUserName(name);
    setUserPicture(picture);
    setIsLoading(false);
    return connected;
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/facebook/campaigns?since=${startDate}&until=${endDate}`);
      const data = await res.json();

      if (data.status === "not_connected") {
        setIsConnected(false);
        return;
      }
      if (data.status === "error") {
        toast.error("Erro ao buscar campanhas", { description: data.message });
        return;
      }

      setCampaigns(data.campaigns || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("Falha ao conectar com a API do Facebook");
    } finally {
      setIsFetching(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) fetchCampaigns();
    });
  }, [checkConnection, fetchCampaigns]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success("Facebook conectado com sucesso! 🎉");
      checkConnection().then((connected) => {
        if (connected) fetchCampaigns();
      });
    }
    if (error) {
      if (error === "access_denied") {
        toast.error("Conexão cancelada", { description: "Você negou o acesso ao Facebook." });
      } else {
        toast.error("Erro ao conectar", { description: decodeURIComponent(error) });
      }
    }
  }, [searchParams, checkConnection, fetchCampaigns]);

  // Recarregar quando datas mudam
  useEffect(() => {
    if (isConnected) fetchCampaigns();
  }, [startDate, endDate, isConnected, fetchCampaigns]);

  const handleConnect = () => {
    window.location.href = "/api/facebook/auth";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    const res = await fetch("/api/facebook/disconnect", { method: "POST" });
    const data = await res.json();
    if (data.status === "success") {
      setIsConnected(false);
      setCampaigns([]);
      setSummary(null);
      setUserName("");
      setUserPicture("");
      toast.success("Desconectado do Facebook.");
    } else {
      toast.error("Erro ao desconectar.");
    }
    setIsDisconnecting(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "PAUSED": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Ativa";
      case "PAUSED": return "Pausada";
      case "ARCHIVED": return "Arquivada";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando conexão...</p>
        </div>
      </div>
    );
  }

  // --- ESTADO: NÃO CONECTADO ---
  if (!isConnected) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Facebook Ads</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Conecte sua conta do Facebook para visualizar o desempenho das suas campanhas.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-8">
            {/* Ícone grande */}
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-3xl bg-[#1877F2] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <FacebookIcon className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Integração Facebook Ads</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Conecte-se com sua conta do Facebook para importar automaticamente as métricas de
                todas as suas campanhas de anúncios: investimento, leads, CPL, CTR e muito mais.
              </p>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { icon: DollarSign, label: "Gasto por campanha" },
                { icon: Users, label: "Leads gerados" },
                { icon: Eye, label: "Impressões e alcance" },
                { icon: Target, label: "CPL em tempo real" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="p-1.5 bg-[#1877F2]/10 rounded-lg">
                    <Icon className="w-3.5 h-3.5 text-[#1877F2]" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full gap-3 bg-[#1877F2] hover:bg-[#1461c4] text-white shadow-lg shadow-blue-500/25 transition-all duration-200 h-12 text-base font-semibold"
              onClick={handleConnect}
            >
              <FacebookIcon className="w-5 h-5" />
              Conectar com Facebook
            </Button>

            <p className="text-xs text-muted-foreground">
              Você será redirecionado para o Facebook para autorizar o acesso.
              <br />
              Seus dados são armazenados com segurança.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- ESTADO: CONECTADO ---
  return (
    <div className="flex flex-col space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <FacebookIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Facebook Ads</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {userPicture && (
                <img src={userPicture} alt={userName} className="w-5 h-5 rounded-full" />
              )}
              <p className="text-muted-foreground text-sm">
                Conectado como <span className="font-medium text-foreground">{userName}</span>
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-muted-foreground"
            onClick={fetchCampaigns}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onChangeStart={setStartDate}
            onChangeEnd={setEndDate}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            <LogOut className="w-3.5 h-3.5" />
            {isDisconnecting ? "Saindo..." : "Desconectar"}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-3">
          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Investido Total</CardTitle>
              <div className="p-2.5 bg-[#1877F2]/10 rounded-lg text-[#1877F2]">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-foreground tracking-tight">{BRL.format(summary.spend)}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Gasto total nas campanhas</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Gerados</CardTitle>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-foreground tracking-tight">{NUM.format(summary.leads)}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Total de leads captados</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo por Lead</CardTitle>
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
                <Target className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-amber-600 tracking-tight">{BRL.format(parseFloat(summary.cpl))}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Custo médio por lead</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impressões</CardTitle>
              <div className="p-2.5 bg-violet-50 rounded-lg text-violet-600">
                <Eye className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-foreground tracking-tight">{NUM.format(summary.impressions)}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Total de impressões</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliques</CardTitle>
              <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
                <MousePointer className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-foreground tracking-tight">{NUM.format(summary.clicks)}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">CTR: {summary.ctr}%</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPM Médio</CardTitle>
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-1">
              <div className="text-[28px] font-bold text-foreground tracking-tight">{BRL.format(parseFloat(summary.cpm))}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Custo por mil impressões</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Campanhas */}
      <Card className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <CardHeader className="px-6 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
              Campanhas ({campaigns.length})
            </CardTitle>
            {isFetching && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Carregando...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="p-4 bg-muted rounded-2xl">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhuma campanha encontrada</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Não há campanhas no período selecionado ou a conta não tem anúncios ativos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campanha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gasto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPL</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impressões</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliques</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTR</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[220px]" title={c.name}>{c.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.account_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(c.status)}`}>
                          {c.status === "ACTIVE" ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                          {statusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">{BRL.format(c.spend)}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-foreground">{NUM.format(c.leads)}</span>
                      </td>
                      <td className="px-4 py-4 text-right text-amber-600 font-semibold">{c.leads > 0 ? BRL.format(parseFloat(c.cpl)) : "—"}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{NUM.format(c.impressions)}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{NUM.format(c.clicks)}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{c.ctr}%</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{BRL.format(parseFloat(c.cpm))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FacebookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    }>
      <FacebookPageInner />
    </Suspense>
  );
}
