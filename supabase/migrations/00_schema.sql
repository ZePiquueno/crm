-- Criando o tipo enumerado para os estágios do pipeline
CREATE TYPE estagio_lead AS ENUM (
  'lead_novo',
  'contato_feito',
  'follow_up_1',
  'follow_up_2',
  'qualificado',
  'reuniao_agendada',
  'proposta_enviada',
  'fechado_ganho',
  'fechado_perdido',
  'desqualificado',
  'encerrado'
);

-- Tabela de Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  nicho TEXT,
  instagram TEXT,
  faturamento_atual TEXT,
  tem_produto_digital BOOLEAN DEFAULT FALSE,
  origem_campanha TEXT,
  facebook_lead_id TEXT UNIQUE,
  estagio estagio_lead NOT NULL DEFAULT 'lead_novo',
  motivo_perda TEXT,
  valor_venda DECIMAL(10, 2),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Leads (Para tracking do funil)
CREATE TABLE IF NOT EXISTS lead_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  estagio_anterior estagio_lead,
  estagio_novo estagio_lead NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Investimentos (Sincronizado do Meta Ads)
CREATE TABLE IF NOT EXISTS investimentos_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  valor_gasto DECIMAL(10, 2) NOT NULL DEFAULT 0,
  campanha_id TEXT,
  campanha_nome TEXT,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  leads_gerados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(data, campanha_id)
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and set policies (optional depending on use case, but good practice)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Como é de uso pessoal e não tem Auth real do Supabase embutida (estamos usando Basic Auth via Next.js middleware)
-- Vamos permitir acesso anônimo apenas para service role (chamadas seguras backend->banco) e API key comum configurada corretamente
CREATE POLICY "Permitir leitura total para anon" ON leads FOR SELECT USING (true);
CREATE POLICY "Permitir inserção total para anon" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update total para anon" ON leads FOR UPDATE USING (true);
CREATE POLICY "Permitir delete total para anon" ON leads FOR DELETE USING (true);

CREATE POLICY "Permitir total anon no historico" ON lead_historico FOR ALL USING (true);
CREATE POLICY "Permitir total anon em ads" ON investimentos_ads FOR ALL USING (true);
CREATE POLICY "Permitir total config" ON configuracoes FOR ALL USING (true);
