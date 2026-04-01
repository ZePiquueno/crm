export type EstagioLead =
  | 'lead_novo'
  | 'contato_feito'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'qualificado'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'fechado_ganho'
  | 'fechado_perdido'
  | 'desqualificado'
  | 'encerrado';

export interface Lead {
  id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
  nicho?: string;
  instagram?: string;
  faturamento_atual?: string;
  tem_produto_digital?: boolean;
  origem_campanha?: string;
  facebook_lead_id?: string;
  estagio: EstagioLead;
  motivo_perda?: string;
  valor_venda?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export const ESTAGIOS_CONFIG: Record<EstagioLead, { label: string; color: string }> = {
  lead_novo: { label: 'Lead Novo', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  contato_feito: { label: 'Contato Feito', color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
  follow_up_1: { label: 'Follow Up 1', color: 'bg-violet-500/20 text-violet-500 border-violet-500/30' },
  follow_up_2: { label: 'Follow Up 2', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  qualificado: { label: 'Qualificado', color: 'bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/30' },
  reuniao_agendada: { label: 'Reunião Agendada', color: 'bg-pink-500/20 text-pink-500 border-pink-500/30' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-rose-500/20 text-rose-500 border-rose-500/30' },
  fechado_ganho: { label: 'Fechado Ganho', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  fechado_perdido: { label: 'Fechado Perdido', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  desqualificado: { label: 'Desqualificado', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  encerrado: { label: 'Encerrado', color: 'bg-zinc-500/20 text-zinc-500 border-zinc-500/30' },
};

export const KANBAN_COLUNAS: EstagioLead[] = [
  'lead_novo',
  'contato_feito',
  'follow_up_1',
  'follow_up_2',
  'qualificado',
  'reuniao_agendada',
  'proposta_enviada',
  'fechado_ganho',
  'desqualificado',
];

export const COLUNAS_ARQUIVO: EstagioLead[] = [
  'fechado_perdido',
  'encerrado',
];
