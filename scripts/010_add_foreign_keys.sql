-- Adicionar foreign keys faltantes para relacionamentos entre tabelas

-- Foreign key entre revendas e planos
ALTER TABLE revendas
ADD CONSTRAINT fk_revendas_plano
FOREIGN KEY (plano_id) REFERENCES planos(id)
ON DELETE SET NULL;

-- Foreign key entre perfis e revendas
ALTER TABLE perfis
ADD CONSTRAINT fk_perfis_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre campanhas e revendas
ALTER TABLE campanhas
ADD CONSTRAINT fk_campanhas_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre campanhas e perfis (criado_por)
ALTER TABLE campanhas
ADD CONSTRAINT fk_campanhas_criado_por
FOREIGN KEY (criado_por) REFERENCES perfis(id)
ON DELETE SET NULL;

-- Foreign key entre vouchers e revendas
ALTER TABLE vouchers
ADD CONSTRAINT fk_vouchers_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre vouchers e perfis (criado_por)
ALTER TABLE vouchers
ADD CONSTRAINT fk_vouchers_criado_por
FOREIGN KEY (criado_por) REFERENCES perfis(id)
ON DELETE SET NULL;

-- Foreign key entre enquetes e revendas
ALTER TABLE enquetes
ADD CONSTRAINT fk_enquetes_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre enquetes e perfis (criado_por)
ALTER TABLE enquetes
ADD CONSTRAINT fk_enquetes_criado_por
FOREIGN KEY (criado_por) REFERENCES perfis(id)
ON DELETE SET NULL;

-- Foreign key entre hotspots e revendas
ALTER TABLE hotspots
ADD CONSTRAINT fk_hotspots_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre hotspots e perfis (cliente_id)
ALTER TABLE hotspots
ADD CONSTRAINT fk_hotspots_cliente
FOREIGN KEY (cliente_id) REFERENCES perfis(id)
ON DELETE CASCADE;

-- Foreign key entre gamificacao e revendas
ALTER TABLE gamificacao
ADD CONSTRAINT fk_gamificacao_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre logs_atividades e revendas
ALTER TABLE logs_atividades
ADD CONSTRAINT fk_logs_atividades_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre logs_atividades e hotspots
ALTER TABLE logs_atividades
ADD CONSTRAINT fk_logs_atividades_hotspot
FOREIGN KEY (hotspot_id) REFERENCES hotspots(id)
ON DELETE CASCADE;

-- Foreign key entre logs_atividades e perfis
ALTER TABLE logs_atividades
ADD CONSTRAINT fk_logs_atividades_usuario
FOREIGN KEY (usuario_id) REFERENCES perfis(id)
ON DELETE SET NULL;

-- Foreign key entre metricas_uso e revendas
ALTER TABLE metricas_uso
ADD CONSTRAINT fk_metricas_uso_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre pontos_usuarios e perfis
ALTER TABLE pontos_usuarios
ADD CONSTRAINT fk_pontos_usuarios_usuario
FOREIGN KEY (usuario_id) REFERENCES perfis(id)
ON DELETE CASCADE;

-- Foreign key entre questoes_enquetes e enquetes
ALTER TABLE questoes_enquetes
ADD CONSTRAINT fk_questoes_enquetes_enquete
FOREIGN KEY (enquete_id) REFERENCES enquetes(id)
ON DELETE CASCADE;

-- Foreign key entre respostas_enquetes e enquetes
ALTER TABLE respostas_enquetes
ADD CONSTRAINT fk_respostas_enquetes_enquete
FOREIGN KEY (enquete_id) REFERENCES enquetes(id)
ON DELETE CASCADE;

-- Foreign key entre respostas_enquetes e questoes_enquetes
ALTER TABLE respostas_enquetes
ADD CONSTRAINT fk_respostas_enquetes_questao
FOREIGN KEY (questao_id) REFERENCES questoes_enquetes(id)
ON DELETE CASCADE;

-- Foreign key entre respostas_enquetes e perfis
ALTER TABLE respostas_enquetes
ADD CONSTRAINT fk_respostas_enquetes_usuario
FOREIGN KEY (usuario_id) REFERENCES perfis(id)
ON DELETE CASCADE;

-- Foreign key entre usuarios e revendas
ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_revenda
FOREIGN KEY (revenda_id) REFERENCES revendas(id)
ON DELETE CASCADE;

-- Foreign key entre sessoes_usuarios e usuarios
ALTER TABLE sessoes_usuarios
ADD CONSTRAINT fk_sessoes_usuarios_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
ON DELETE CASCADE;

-- Foreign key entre logs_acesso e usuarios
ALTER TABLE logs_acesso
ADD CONSTRAINT fk_logs_acesso_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
ON DELETE SET NULL;

-- Criar índices para melhorar performance das queries com foreign keys
CREATE INDEX IF NOT EXISTS idx_revendas_plano_id ON revendas(plano_id);
CREATE INDEX IF NOT EXISTS idx_perfis_revenda_id ON perfis(revenda_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_revenda_id ON campanhas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_criado_por ON campanhas(criado_por);
CREATE INDEX IF NOT EXISTS idx_vouchers_revenda_id ON vouchers(revenda_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_revenda_id ON enquetes(revenda_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_revenda_id ON hotspots(revenda_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_cliente_id ON hotspots(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_revenda_id ON logs_atividades(revenda_id);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_hotspot_id ON logs_atividades(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_pontos_usuarios_usuario_id ON pontos_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_questoes_enquetes_enquete_id ON questoes_enquetes(enquete_id);
CREATE INDEX IF NOT EXISTS idx_respostas_enquetes_enquete_id ON respostas_enquetes(enquete_id);
CREATE INDEX IF NOT EXISTS idx_respostas_enquetes_questao_id ON respostas_enquetes(questao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_revenda_id ON usuarios(revenda_id);
