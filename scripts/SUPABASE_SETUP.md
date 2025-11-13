# Supabase (Esquema em Português)

O arquivo [`030_full_pt_br_schema.sql`](./030_full_pt_br_schema.sql) recria todas as tabelas esperadas pelo portal (revendas, clientes, campanhas, enquetes, anúncios, integrações, portal cativo, etc.) usando nomenclatura em português. Use-o sempre que precisar alinhar um projeto Supabase novo ou legado ao código atual.

## Pré-requisitos
- [Supabase CLI](https://supabase.com/docs/guides/cli) autenticada com o seu projeto (`supabase login`)
- Variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` configuradas no `.env.local` do app

## Passo a passo
1. **Sincronizar o schema**
   ```bash
   supabase db push --db-url "$SUPABASE_DB_URL" --file scripts/030_full_pt_br_schema.sql
   ```
   > Substitua `SUPABASE_DB_URL` pela connection string Postgres disponível no dashboard (configurações → Database → Connection info).

2. **Criar o usuário administrador**
   O script já inclui um admin padrão (`admin` / `admin123`). Ajuste diretamente via SQL, se desejar outros dados:
   ```sql
   UPDATE public.usuarios
      SET senha_hash = crypt('sua_senha', gen_salt('bf'))
    WHERE username = 'admin';
   ```
   > O app usa SHA-256 no login, portanto gere o hash com `pnpm tsx scripts/utils/hash-password.ts <senha>` ou qualquer utilitário compatível.

3. **Conferir o portal**
   - Faça login com `admin / admin123`
   - Cadastre uma revenda/cliente, crie campanhas e enquetes
   - Configure o portal em `/client/hotspot` e visualize a prévia em `/client/portal-preview`

4. **Dados iniciais**
   O script cria automaticamente:
   - Plano “Starter”
   - Revenda “Revenda Demo” vinculada ao plano
   - Perfil + usuário admin geral

Repita a execução do script sempre que houver alterações estruturais importantes. Como ele usa `DROP TABLE ... CASCADE`, execute apenas em ambientes de desenvolvimento ou em bases vazias.
