import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/types";
import { Phone, Tag, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const timeInStage = formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true, locale: ptBR });

  return (
    <Card className={`cursor-pointer transition-all duration-200 bg-card border border-border/50 rounded-lg hover:shadow-md hover:border-primary/30 ${isDragging ? 'shadow-xl ring-2 ring-primary/30 scale-[1.02]' : 'shadow-sm'}`}>
      <CardContent className="p-3.5">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-[13px] text-foreground leading-tight">{lead.nome}</h4>
        </div>
        
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          {lead.nicho && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-primary/70" />
              <span>{lead.nicho}</span>
            </div>
          )}
          {lead.whatsapp && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-emerald-500/70" />
              <span>{lead.whatsapp}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[9px] mt-2.5 pt-2 border-t border-border/40 text-muted-foreground/60 font-medium">
            <Clock className="w-2.5 h-2.5" />
            <span>{timeInStage}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
