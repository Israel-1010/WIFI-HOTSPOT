-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Todas as tabelas em português com relacionamentos corretos
-- =====================================================

-- Limpar tudo (caso necessário)
DROP TABLE IF EXISTS public.respostas_enquetes CASCADE;
DROP TABLE IF EXISTS public.questoes_enquetes CASCADE;
DROP TABLE IF EXISTS public.enquetes CASCADE;
DROP TABLE IF EXISTS public.logs_atividades CASCADE;
DROP TABLE IF EXISTS public.pontos_usuarios CASCADE;
DROP TABLE IF EXISTS public.gamificacao CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.campanhas CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =====================================================
-- 1. TABELA DE PERFIS (profiles)
-- =====================================================
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
  avatar_url TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para perfis
CREATE INDEX idx_perfis_email ON public.perfis(email);
CREATE INDEX idx_perfis_role ON public.perfis(role);

-- =====================================================
-- 2. TABELA DE CAMPANHAS
-- =====================================================
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'sms', 'push', 'banner', 'popup')),
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida')),
  conteudo JSONB,
  configuracoes JSONB,
  publico_alvo JSONB,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  posicao_modal TEXT,
  visualizacoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para campanhas
CREATE INDEX idx_campanhas_status ON public.campanhas(status);
CREATE INDEX idx_campanhas_tipo ON public.campanhas(tipo);
CREATE INDEX idx_campanhas_criado_por ON public.campanhas(criado_por);

-- =====================================================
-- 3. TABELA DE VOUCHERS
-- =====================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('desconto', 'frete_gratis', 'brinde', 'cashback')),
  valor DECIMAL(10,2),
  porcentagem INTEGER,
  quantidade_total INTEGER,
  quantidade_usada INTEGER DEFAULT 0,
  data_validade TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'expirado')),
  condicoes JSONB,
  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para vouchers
CREATE INDEX idx_vouchers_codigo ON public.vouchers(codigo);
CREATE INDEX idx_vouchers_status ON public.vouchers(status);
CREATE INDEX idx_vouchers_data_validade ON public.vouchers(data_validade);

-- =====================================================
-- 4. TABELA DE ENQUETES
-- =====================================================
CREATE TABLE public.enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  total_respostas INTEGER DEFAULT 0,
  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para enquetes
CREATE INDEX idx_enquetes_status ON public.enquetes(status);
CREATE INDEX idx_enquetes_criado_por ON public.enquetes(criado_por);

-- =====================================================
-- 5. TABELA DE QUESTÕES DAS ENQUETES
-- =====================================================
CREATE TABLE public.questoes_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID NOT NULL REFERENCES public.enquetes(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('multipla_escolha', 'texto', 'escala', 'sim_nao')),
  opcoes JSONB,
  obrigatoria BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para questões
CREATE INDEX idx_questoes_enquete_id ON public.questoes_enquetes(enquete_id);

-- =====================================================
-- 6. TABELA DE RESPOSTAS DAS ENQUETES
-- =====================================================
CREATE TABLE public.respostas_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID NOT NULL REFERENCES public.enquetes(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.questoes_enquetes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  resposta JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para respostas
CREATE INDEX idx_respostas_enquete_id ON public.respostas_enquetes(enquete_id);
CREATE INDEX idx_respostas_usuario_id ON public.respostas_enquetes(usuario_id);

-- =====================================================
-- 7. TABELA DE GAMIFICAÇÃO
-- =====================================================
CREATE TABLE public.gamificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('missao', 'conquista', 'recompensa')),
  pontos INTEGER DEFAULT 0,
  icone TEXT,
  condicoes JSONB,
  recompensas JSONB,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para gamificação
CREATE INDEX idx_gamificacao_tipo ON public.gamificacao(tipo);
CREATE INDEX idx_gamificacao_status ON public.gamificacao(status);

-- =====================================================
-- 8. TABELA DE PONTOS DOS USUÁRIOS
-- =====================================================
CREATE TABLE public.pontos_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  conquistas JSONB DEFAULT '[]'::jsonb,
  historico JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- Índices para pontos
CREATE INDEX idx_pontos_usuario_id ON public.pontos_usuarios(usuario_id);
CREATE INDEX idx_pontos_totais ON public.pontos_usuarios(pontos_totais DESC);

-- =====================================================
-- 9. TABELA DE LOGS DE ATIVIDADES
-- =====================================================
CREATE TABLE public.logs_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('connection', 'disconnection', 'authentication', 'action')),
  acao TEXT NOT NULL,
  detalhes JSONB,
  ip_address TEXT,
  mac_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX idx_logs_usuario_id ON public.logs_atividades(usuario_id);
CREATE INDEX idx_logs_tipo ON public.logs_atividades(tipo);
CREATE INDEX idx_logs_created_at ON public.logs_atividades(created_at DESC);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para verificar se usuário é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  );
  
  -- Criar registro de pontos para o novo usuário
  INSERT INTO public.pontos_usuarios (usuario_id, pontos_totais, nivel)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_perfis_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_campanhas_updated_at
  BEFORE UPDATE ON public.campanhas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_enquetes_updated_at
  BEFORE UPDATE ON public.enquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_gamificacao_updated_at
  BEFORE UPDATE ON public.gamificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pontos_usuarios_updated_at
  BEFORE UPDATE ON public.pontos_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Função para incrementar respostas da enquete
CREATE OR REPLACE FUNCTION public.increment_survey_responses()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.enquetes
  SET total_respostas = total_respostas + 1
  WHERE id = NEW.enquete_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_survey_responses_trigger
  AFTER INSERT ON public.respostas_enquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_survey_responses();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFIS
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON public.perfis FOR SELECT
  USING (is_admin());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar qualquer perfil"
  ON public.perfis FOR UPDATE
  USING (is_admin());

-- Políticas para CAMPANHAS
CREATE POLICY "Todos podem ver campanhas ativas"
  ON public.campanhas FOR SELECT
  USING (status = 'ativa' OR is_admin());

CREATE POLICY "Admins podem inserir campanhas"
  ON public.campanhas FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar campanhas"
  ON public.campanhas FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar campanhas"
  ON public.campanhas FOR DELETE
  USING (is_admin());

-- Políticas para VOUCHERS
CREATE POLICY "Todos podem ver vouchers ativos"
  ON public.vouchers FOR SELECT
  USING (status = 'ativo' OR is_admin());

CREATE POLICY "Admins podem inserir vouchers"
  ON public.vouchers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar vouchers"
  ON public.vouchers FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar vouchers"
  ON public.vouchers FOR DELETE
  USING (is_admin());

-- Políticas para ENQUETES
CREATE POLICY "Todos podem ver enquetes ativas"
  ON public.enquetes FOR SELECT
  USING (status = 'ativa' OR is_admin());

CREATE POLICY "Admins podem inserir enquetes"
  ON public.enquetes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar enquetes"
  ON public.enquetes FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar enquetes"
  ON public.enquetes FOR DELETE
  USING (is_admin());

-- Políticas para QUESTÕES DAS ENQUETES
CREATE POLICY "Todos podem ver questões de enquetes ativas"
  ON public.questoes_enquetes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enquetes
      WHERE id = enquete_id AND (status = 'ativa' OR is_admin())
    )
  );

CREATE POLICY "Admins podem inserir questões"
  ON public.questoes_enquetes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar questões"
  ON public.questoes_enquetes FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar questões"
  ON public.questoes_enquetes FOR DELETE
  USING (is_admin());

-- Políticas para RESPOSTAS DAS ENQUETES
CREATE POLICY "Usuários podem ver suas próprias respostas"
  ON public.respostas_enquetes FOR SELECT
  USING (auth.uid() = usuario_id OR is_admin());

CREATE POLICY "Usuários autenticados podem inserir respostas"
  ON public.respostas_enquetes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem ver todas as respostas"
  ON public.respostas_enquetes FOR SELECT
  USING (is_admin());

-- Políticas para GAMIFICAÇÃO
CREATE POLICY "Todos podem ver gamificação ativa"
  ON public.gamificacao FOR SELECT
  USING (status = 'ativa' OR is_admin());

CREATE POLICY "Admins podem inserir gamificação"
  ON public.gamificacao FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar gamificação"
  ON public.gamificacao FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar gamificação"
  ON public.gamificacao FOR DELETE
  USING (is_admin());

-- Políticas para PONTOS DOS USUÁRIOS
CREATE POLICY "Usuários podem ver seus próprios pontos"
  ON public.pontos_usuarios FOR SELECT
  USING (auth.uid() = usuario_id OR is_admin());

CREATE POLICY "Sistema pode inserir pontos"
  ON public.pontos_usuarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar pontos"
  ON public.pontos_usuarios FOR UPDATE
  USING (true);

-- Políticas para LOGS DE ATIVIDADES
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON public.logs_atividades FOR SELECT
  USING (auth.uid() = usuario_id OR is_admin());

CREATE POLICY "Sistema pode inserir logs"
  ON public.logs_atividades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins podem ver todos os logs"
  ON public.logs_atividades FOR SELECT
  USING (is_admin());

-- =====================================================
-- DADOS DE EXEMPLO (SEED)
-- =====================================================

-- Inserir campanhas de exemplo
INSERT INTO public.campanhas (nome, tipo, descricao, status, visualizacoes, cliques, conversoes) VALUES
('Bem-vindo ao WiFi', 'popup', 'Campanha de boas-vindas para novos usuários', 'ativa', 1250, 340, 89),
('Promoção de Verão', 'banner', 'Descontos especiais para o verão', 'ativa', 2100, 567, 123),
('Newsletter Semanal', 'email', 'Envio semanal de novidades', 'ativa', 890, 234, 45);

-- Inserir vouchers de exemplo
INSERT INTO public.vouchers (codigo, titulo, descricao, tipo, porcentagem, quantidade_total, quantidade_usada, status, data_validade) VALUES
('BEMVINDO10', 'Desconto de Boas-Vindas', '10% de desconto na primeira compra', 'desconto', 10, 100, 23, 'ativo', NOW() + INTERVAL '30 days'),
('FRETEGRATIS', 'Frete Grátis', 'Frete grátis em compras acima de R$ 100', 'frete_gratis', NULL, 50, 12, 'ativo', NOW() + INTERVAL '60 days'),
('VERAO2025', 'Promoção de Verão', '25% de desconto em produtos selecionados', 'desconto', 25, 200, 67, 'ativo', NOW() + INTERVAL '90 days');

-- Inserir enquetes de exemplo
INSERT INTO public.enquetes (titulo, descricao, status, total_respostas) VALUES
('Satisfação com o WiFi', 'Avalie sua experiência com nosso serviço de WiFi', 'ativa', 0),
('Preferências de Produtos', 'Ajude-nos a entender suas preferências', 'ativa', 0);

-- Inserir questões para as enquetes
INSERT INTO public.questoes_enquetes (enquete_id, pergunta, tipo, opcoes, obrigatoria, ordem)
SELECT 
  e.id,
  'Como você avalia a velocidade da internet?',
  'multipla_escolha',
  '["Excelente", "Boa", "Regular", "Ruim"]'::jsonb,
  true,
  1
FROM public.enquetes e WHERE e.titulo = 'Satisfação com o WiFi';

INSERT INTO public.questoes_enquetes (enquete_id, pergunta, tipo, opcoes, obrigatoria, ordem)
SELECT 
  e.id,
  'Você recomendaria nosso serviço?',
  'sim_nao',
  '["Sim", "Não"]'::jsonb,
  true,
  2
FROM public.enquetes e WHERE e.titulo = 'Satisfação com o WiFi';

-- Inserir gamificação de exemplo
INSERT INTO public.gamificacao (nome, descricao, tipo, pontos, status) VALUES
('Primeira Conexão', 'Conecte-se pela primeira vez', 'conquista', 10, 'ativa'),
('Usuário Frequente', 'Conecte-se 10 vezes', 'conquista', 50, 'ativa'),
('Responder Enquete', 'Complete uma enquete', 'missao', 20, 'ativa'),
('Usar Voucher', 'Use um voucher pela primeira vez', 'missao', 15, 'ativa');

-- Inserir logs de exemplo
INSERT INTO public.logs_atividades (tipo, acao, detalhes, ip_address) VALUES
('connection', 'Usuário conectado ao WiFi', '{"device": "iPhone 13", "location": "Loja Centro"}'::jsonb, '192.168.1.100'),
('authentication', 'Login realizado com sucesso', '{"method": "email"}'::jsonb, '192.168.1.101'),
('action', 'Voucher resgatado', '{"voucher": "BEMVINDO10"}'::jsonb, '192.168.1.102');

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Todas as tabelas foram criadas com sucesso
-- Relacionamentos configurados corretamente
-- Políticas RLS sem recursão
-- Dados de exemplo inseridos
-- =====================================================
