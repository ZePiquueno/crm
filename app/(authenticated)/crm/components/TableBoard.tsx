"use client";

import { Lead, ESTAGIOS_CONFIG } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function TableBoard({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-background">Nenhum lead encontrado.</div>;
  }

  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Nicho</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Estágio Atual</TableHead>
            <TableHead className="text-right">Data de Entrada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium text-foreground">{lead.nome}</TableCell>
              <TableCell className="text-muted-foreground">{lead.nicho || "-"}</TableCell>
              <TableCell className="text-muted-foreground">{lead.whatsapp || "-"}</TableCell>
              <TableCell>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-transparent ${ESTAGIOS_CONFIG[lead.estagio].color}`}>
                  {ESTAGIOS_CONFIG[lead.estagio].label}
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
