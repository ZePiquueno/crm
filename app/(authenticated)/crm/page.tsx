"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "./components/KanbanBoard";
import { TableBoard } from "./components/TableBoard";
import { DateFilter } from "@/components/DateFilter";
import { supabase } from "@/lib/supabase";

// Mock apenas para desenvolvimento da UI (Será substituído por dados do Supabase)
import { Lead } from "@/lib/types";
const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    nome: "João Fitness",
    nicho: "Emagrecimento",
    whatsapp: "1199999999",
    estagio: "lead_novo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    nome: "Maria Finanças",
    nicho: "Investimentos",
    whatsapp: "1188888888",
    estagio: "contato_feito",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchLeads = async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      
      if (data && !error) {
        setLeads(data);
        localStorage.setItem("crm_leads_mock", JSON.stringify(data)); // Cache opcional
      } else {
        console.error("Erro ao buscar leads:", error);
      }
    };
    
    fetchLeads();
  }, []);

  const handleLeadsChange = async (newLeads: Lead[], updatedLead?: Lead) => {
    setLeads(newLeads);
    localStorage.setItem("crm_leads_mock", JSON.stringify(newLeads));
    
    // Se recebeu um lead atualizado especificamente, atualiza no banco
    if (updatedLead && updatedLead.id) {
      const { error } = await supabase
        .from('leads')
        .update({
           estagio: updatedLead.estagio,
           nome: updatedLead.nome,
           email: updatedLead.email,
           whatsapp: updatedLead.whatsapp,
           nicho: updatedLead.nicho,
           instagram: updatedLead.instagram,
           faturamento_atual: updatedLead.faturamento_atual,
           tem_produto_digital: updatedLead.tem_produto_digital,
           valor_venda: updatedLead.valor_venda,
           notas: updatedLead.notas
        })
        .eq('id', updatedLead.id);
        
      if (error) console.error("Erro ao atualizar o lead no banco:", error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o pipeline de captação de experts.
          </p>
        </div>
        <DateFilter />
      </div>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col h-full min-h-0">
        <TabsList className="w-[fit-content]">
          <TabsTrigger value="kanban">Visualização Kanban</TabsTrigger>
          <TabsTrigger value="table">Lista (Tabela)</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="flex-1 mt-4 overflow-hidden outline-none">
          <KanbanBoard leads={leads} onLeadsChange={handleLeadsChange} />
        </TabsContent>
        <TabsContent value="table" className="flex-1 mt-4 outline-none">
          <TableBoard leads={leads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
