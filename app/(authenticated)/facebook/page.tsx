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
  Download,
  ChevronDown,
  Check,
  Webhook,
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

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
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
  const [isSyncingLeads, setIsSyncingLeads] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

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

  const fetchCampaigns = useCallback(async (accountId?: string) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ since: startDate, until: endDate });
      if (accountId) params.set('account', accountId);

      const res = await fetch(`/api/facebook/campaigns?${params}`);
      const data = await res.json();

      if (data.status === "not_connected") { setIsConnected(false); return; }
      if (data.status === "error") {
        toast.error("Erro ao buscar campanhas", { description: data.message });
        return;
      }

      setAdAccounts(data.adAccounts || []);
      if (data.selectedAccountId) setSelectedAccountId(data.selectedAccountId);
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
      checkConnection().then((connected) => { if (connected) fetchCampaigns(); });
    }
    if (error) {
      toast.error("Erro ao conectar", {
        description: error === "access_denied" ? "Você negou o acesso." : decodeURIComponent(error)
      });
    }
  }, [searchParams, checkConnection, fetchCampaigns]);

  useEffect(() => {
    if (isConnected) fetchCampaigns();
  }, [startDate, endDate, isConnected, fetchCampaigns]);

  const handleSelectAccount = async (accountId: string) => {
    setShowAccountDropdown(false);
    setSelectedAccountId(accountId);
    // Salvar no Supabase
    await fetch('/api/facebook/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    });
    // Recarregar campanhas com nova conta
    await fetchCampaigns(accountId);
    toast.success("Conta de anúncios alterada!");
  };

  const handleSyncLeads = async () => {
    setIsSyncingLeads(true);
    const toastId = toast.loading("Sincronizando leads do Facebook Lead Ads...");
    try {
      const res = await fetch('/api/facebook/leads-sync', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);
      toast.success("Leads sincronizados!", {
        id: toastId,
        description: `${data.stats.leadsAdded} novos leads adicionados ao CRM. ${data.stats.leadsSkipped} já existentes ignorados.`
      });
    } catch (err: any) {
      toast.error("Falha ao sincronizar leads", { id: toastId, description: err.message });
    } finally {
      setIsSyncingLeads(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    const res = await fetch("/api/facebook/disconnect", { method: "POST" });
    const data = await res.json();
    if (data.status === "success") {
      setIsConnected(false); setCampaigns([]); setSummary(null);
      setUserName(""); setUserPicture(""); setAdAccounts([]);
      toast.success("Desconectado do Facebook.");
    } else {
      toast.error("Erro ao desconectar.");
    }
    setIsDisconnecting(false);
  };

  const statusColor = (s: string) => ({
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PAUSED: "bg-amber-100 text-amber-700 border-amber-200",
  }[s] || "bg-gray-100 text-gray-600 border-gray-200");

  const statusLabel = (s: string) => ({ ACTIVE: "Ativa", PAUSED: "Pausada", ARCHIVED: "Arquivada" }[s] || s);

  const selectedAccountName = adAccounts.find(a => a.id === selectedAccountId)?.name || selectedAccountId;

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Verificando conexão...</p>
      </div>
    </div>
  );

  // --- NÃO CONECTADO ---
  if (!isConnected) return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Facebook Ads</h1>
        <p className="text-muted-foreground mt-1 text-sm">Conecte sua conta para visualizar campanhas e importar leads automaticamente.</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md space-y-8">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-[#1877F2] flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <FacebookIcon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Integração Facebook Ads</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Conecte-se para importar campanhas, métricas e leads automaticamente para o CRM.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: DollarSign, label: "Gasto por campanha" },
              { icon: Users, label: "Leads automáticos" },
              { icon: Eye, label: "Impressões e alcance" },
              { icon: Target, label: "CPL em tempo real" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="p-1.5 bg-[#1877F2]/10 rounded-lg"><Icon className="w-3.5 h-3.5 text-[#1877F2]" /></div>
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full gap-3 bg-[#1877F2] hover:bg-[#1461c4] text-white shadow-lg shadow-blue-500/25 h-12 text-base font-semibold"
            onClick={() => { window.location.href = "/api/facebook/auth"; }}
          >
            <FacebookIcon className="w-5 h-5" />
            Conectar com Facebook
          </Button>
          <p className="text-xs text-muted-foreground">
            Você será redirecionado para o Facebook para autorizar o acesso. Seus dados ficam seguros.
          </p>
        </div>
      </div>
    </div>
  );

  // --- CONECTADO ---
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
              {userPicture && <img src={userPicture} alt={userName} className="w-5 h-5 rounded-full" />}
              <p className="text-muted-foreground text-sm">
                Conectado como <span className="font-medium text-foreground">{userName}</span>
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de conta */}
          {adAccounts.length > 1 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 max-w-[200px]"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <span className="truncate text-xs">{selectedAccountName || "Selecionar conta"}</span>
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              </Button>
              {showAccountDropdown && (
                <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[220px] overflow-hidden">
                  {adAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc.id)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center gap-3 transition-colors text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">{acc.id}</p>
                      </div>
                      {acc.id === selectedAccountId && <Check className="w-4 h-4 text-[#1877F2] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground" onClick={() => fetchCampaigns()} disabled={isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
            onClick={handleSyncLeads}
            disabled={isSyncingLeads}
          >
            <Download className={`w-3.5 h-3.5 ${isSyncingLeads ? "animate-bounce" : ""}`} />
            {isSyncingLeads ? "Importando..." : "Sincronizar Leads"}
          </Button>

          <DateFilter startDate={startDate} endDate={endDate} onChangeStart={setStartDate} onChangeEnd={setEndDate} />

          <Button
            variant="outline" size="sm"
            className="h-9 gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
            onClick={handleDisconnect} disabled={isDisconnecting}
          >
            <LogOut className="w-3.5 h-3.5" />
            {isDisconnecting ? "Saindo..." : "Desconectar"}
          </Button>
        </div>
      </div>

      {/* Seletor de conta única ou aviso */}
      {adAccounts.length === 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <FacebookIcon className="w-4 h-4 flex-shrink-0" />
          <span>Conta ativa: <strong>{adAccounts[0].name}</strong> ({adAccounts[0].id})</span>
        </div>
      )}

      {/* Cards de Resumo */}
      {summary ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { label: "Investido Total", value: BRL.format(summary.spend), sub: "Gasto total nas campanhas", icon: DollarSign, color: "bg-[#1877F2]/10 text-[#1877F2]" },
            { label: "Leads Gerados", value: NUM.format(summary.leads), sub: "Total de leads captados", icon: Users, color: "bg-emerald-50 text-emerald-600" },
            { label: "Custo por Lead", value: BRL.format(parseFloat(summary.cpl)), sub: "Custo médio por lead", icon: Target, color: "bg-amber-50 text-amber-600", valueColor: "text-amber-600" },
            { label: "Impressões", value: NUM.format(summary.impressions), sub: "Total de impressões", icon: Eye, color: "bg-violet-50 text-violet-600" },
            { label: "Cliques", value: NUM.format(summary.clicks), sub: `CTR: ${summary.ctr}%`, icon: MousePointer, color: "bg-sky-50 text-sky-600" },
            { label: "CPM Médio", value: BRL.format(parseFloat(summary.cpm)), sub: "Custo por mil impressões", icon: TrendingUp, color: "bg-primary/10 text-primary" },
          ].map(({ label, value, sub, icon: Icon, color, valueColor }) => (
            <Card key={label} className="bg-card border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5 gap-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
                <div className={`p-2.5 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent className="px-6 pb-5 pt-1">
                <div className={`text-[28px] font-bold tracking-tight ${valueColor || "text-foreground"}`}>{value}</div>
                <p className="text-[11px] text-muted-foreground mt-2 font-medium">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isFetching ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[108px] animate-pulse bg-muted/30 border border-border/40 rounded-xl" />
          ))}
        </div>
      ) : null}

      {/* Aviso de Webhook */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
        <Webhook className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">Leads em tempo real (Webhook)</p>
          <p className="text-amber-700 mt-0.5 text-xs">
            Para receber leads automaticamente assim que alguém preencher um formulário, configure o webhook no Facebook App
            com a URL: <code className="bg-amber-100 px-1 rounded font-mono">{process.env.NEXT_PUBLIC_APP_URL || "https://seu-dominio.com"}/api/facebook/webhook</code>{" "}
            e o token de verificação: <code className="bg-amber-100 px-1 rounded font-mono">crm_webhook_secret_2025</code>.
            Até lá, use o botão <strong>"Sincronizar Leads"</strong> para importar manualmente.
          </p>
        </div>
      </div>

      {/* Tabela de Campanhas */}
      <Card className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <CardHeader className="px-6 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
              Campanhas ({campaigns.length})
              {campaigns.length === 0 && !isFetching && (
                <span className="text-xs text-muted-foreground font-normal ml-1">— sem dados no período</span>
              )}
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
                Não há dados de campanhas no período selecionado. Tente um período maior ou verifique a conta de anúncios.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    {["Campanha", "Status", "Gasto", "Leads", "CPL", "Impressões", "Cliques", "CTR", "CPM"].map((h, i) => (
                      <th key={h} className={`py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i === 0 ? "text-left px-6" : i <= 1 ? "text-left px-4" : "text-right px-4"} ${i === 8 ? "pr-6" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[220px]" title={c.name}>{c.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.objective?.replace(/_/g, " ") || c.account_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(c.status)}`}>
                          {c.status === "ACTIVE" ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                          {statusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">{BRL.format(c.spend)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">{NUM.format(c.leads)}</td>
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
