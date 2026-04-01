"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [token, setToken] = useState("");
  const [adAccount, setAdAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data, error } = await supabase.from("configuracoes").select("*");
      if (data && !error) {
        data.forEach((item) => {
          if (item.chave === "meta_token") setToken(item.valor);
          if (item.chave === "ad_account") setAdAccount(item.valor);
        });
      }
      setLoading(false);
    };
    fetchConfigs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    
    // Save token
    await supabase.from("configuracoes").upsert(
      { chave: "meta_token", valor: token },
      { onConflict: "chave" }
    );
    
    // Save adAccount
    await supabase.from("configuracoes").upsert(
      { chave: "ad_account", valor: adAccount },
      { onConflict: "chave" }
    );

    setSaving(false);
    setStatusMsg("Configurações salvas com sucesso no Supabase!");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Carregando configurações...</div>;

  return (
    <div className="flex flex-col h-full space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas integrações com Meta Ads e o Banco de Dados.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Integração Meta Ads</CardTitle>
            <CardDescription>
              Para o Dashboard puxar automaticamente os gastos e leads gerados, informe suas credenciais da Meta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="meta_token" className="text-sm font-medium">Meta Access Token</label>
              <Input 
                id="meta_token" 
                type="password" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="EAAI..." 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ad_account" className="text-sm font-medium">Ad Account ID</label>
              <Input 
                id="ad_account" 
                value={adAccount} 
                onChange={(e) => setAdAccount(e.target.value)} 
                placeholder="act_123456789" 
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
              {statusMsg && <span className="text-sm text-emerald-600 font-medium">{statusMsg}</span>}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Backend</CardTitle>
            <CardDescription>
              Conexões do banco onde os Leads são salvos. Como já estão no .env.local, o sistema está online.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="supa_url" className="text-sm font-medium">Project URL</label>
              <Input id="supa_url" defaultValue={process.env.NEXT_PUBLIC_SUPABASE_URL || ""} disabled />
            </div>
            <div className="space-y-2">
              <label htmlFor="supa_key" className="text-sm font-medium">Anon Key</label>
              <Input id="supa_key" type="password" defaultValue={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""} disabled />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
