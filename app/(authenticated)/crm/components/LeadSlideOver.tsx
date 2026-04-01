"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Lead, ESTAGIOS_CONFIG } from "@/lib/types";
import { ExternalLink, MessageCircle, FileX2, CheckCircle, Edit2, Save, X } from "lucide-react";

interface LeadSlideOverProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdateLead?: (lead: Lead) => void;
}

export function LeadSlideOver({ lead, open, onClose, onUpdateLead }: LeadSlideOverProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    }
    setIsEditing(false);
  }, [lead, open]);

  if (!lead) return null;

  const wppLink = lead.whatsapp 
    ? `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`
    : "#";

  const handleSave = () => {
    if (onUpdateLead) {
      onUpdateLead(formData as Lead);
    }
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: "desqualificado" | "fechado_ganho") => {
    if (onUpdateLead) {
      onUpdateLead({ ...lead, estagio: newStatus });
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6 sm:p-10 bg-card border-l border-border">
        <SheetHeader className="mb-6 mt-4">
          <div className="flex justify-between items-start gap-4 pr-6">
            {isEditing ? (
              <Input 
                value={formData.nome || ""} 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
                className="font-bold text-xl h-10 w-full" 
              />
            ) : (
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">{lead.nome}</SheetTitle>
            )}
          </div>
          <SheetDescription className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ESTAGIOS_CONFIG[lead.estagio].color} bg-secondary border border-border/50`}>
              {ESTAGIOS_CONFIG[lead.estagio].label}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm">
          {!isEditing && (
            <section className="space-y-3">
              <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="default" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" asChild>
                  <a href={wppLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                {lead.instagram && (
                  <Button variant="outline" className="w-full font-semibold" asChild>
                    <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="destructive" className="w-full font-semibold" onClick={() => handleStatusChange("desqualificado")}>
                  <FileX2 className="w-4 h-4 mr-2" />
                  Desqualificar
                </Button>
                <Button variant="outline" className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold" onClick={() => handleStatusChange("fechado_ganho")}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fechar Negócio
                </Button>
              </div>
              <div className="grid grid-cols-1 pt-2">
                <Button variant="secondary" className="w-full font-semibold" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar Informações do Lead
                </Button>
              </div>
            </section>
          )}

          {isEditing && (
            <section className="space-y-4 bg-secondary/50 p-5 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2"><Edit2 className="w-4 h-4"/> Modo de Edição</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0 hover:bg-muted rounded-full"><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">E-mail</label>
                <Input value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">WhatsApp</label>
                <Input value={formData.whatsapp || ""} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Nicho</label>
                <Input value={formData.nicho || ""} onChange={e => setFormData({...formData, nicho: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Instagram</label>
                <Input value={formData.instagram || ""} onChange={e => setFormData({...formData, instagram: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Faturamento Atual</label>
                  <Input value={formData.faturamento_atual || ""} onChange={e => setFormData({...formData, faturamento_atual: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tem Produto?</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.tem_produto_digital ? "sim" : "nao"}
                    onChange={e => setFormData({...formData, tem_produto_digital: e.target.value === "sim"})}
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2 pt-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Valor Fechado (Receita)</label>
                  <Input type="number" value={formData.valor_venda || ""} onChange={e => setFormData({...formData, valor_venda: parseFloat(e.target.value) || 0})} placeholder="R$ 0,00" className="border-emerald-300 text-emerald-700 font-bold focus-visible:ring-emerald-400" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Anotações do Lead</label>
                <textarea 
                  value={formData.notas || ""} 
                  onChange={(e: any) => setFormData({...formData, notas: e.target.value})} 
                  placeholder="Escreva detalhes da negociação, histórico ou dores do cliente..." 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              
              <Button onClick={handleSave} className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm tracking-wide">
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </section>
          )}

          <Separator />

          {!isEditing && (
            <>
              <section className="space-y-4 pt-2">
                <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Informações</h3>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 bg-secondary/30 p-4 rounded-xl border border-border/40">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">E-mail</p>
                    <p className="font-medium text-[13px] truncate text-foreground" title={lead.email || "-"}>{lead.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">WhatsApp</p>
                    <p className="font-medium text-[13px] text-foreground truncate">{lead.whatsapp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Instagram</p>
                    <p className="font-medium text-[13px] text-foreground truncate">{lead.instagram || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Nicho</p>
                    <p className="font-medium text-[13px] text-primary">{lead.nicho || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Faturamento Atual</p>
                    <p className="font-medium text-[13px] text-foreground">{lead.faturamento_atual || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Tem Produto?</p>
                    <p className="font-medium text-[13px] text-foreground">{lead.tem_produto_digital ? "Sim" : "Não"}</p>
                  </div>
                  {(lead.valor_venda ?? 0) > 0 && (
                    <div className="col-span-2 border-t border-border/50 pt-3 mt-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Valor do Contrato</p>
                      <p className="font-bold font-heading text-emerald-600 text-xl">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_venda || 0)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3 pt-2">
                <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Notas e Anotações</h3>
                <div className="bg-secondary/30 border border-border/40 p-4 rounded-xl min-h-[80px] text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {lead.notas ? lead.notas : <span className="text-muted-foreground italic text-xs">Nenhuma anotação registrada.</span>}
                </div>
              </section>
            </>
          )}
          
        </div>
      </SheetContent>
    </Sheet>
  );
}
