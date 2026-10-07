-- Renomeia a tabela do catálogo de "servicos" para "itens_catalogo",
-- preservando os dados. Também alinha os nomes de índices e constraints
-- ao novo nome de tabela esperado pelo Prisma.

ALTER TABLE "servicos" RENAME TO "itens_catalogo";

-- Primary key
ALTER TABLE "itens_catalogo" RENAME CONSTRAINT "servicos_pkey" TO "itens_catalogo_pkey";

-- Check constraints
ALTER TABLE "itens_catalogo" RENAME CONSTRAINT "servicos_price_cents_check" TO "itens_catalogo_price_cents_check";
ALTER TABLE "itens_catalogo" RENAME CONSTRAINT "servicos_duration_minutes_check" TO "itens_catalogo_duration_minutes_check";

-- Index
ALTER INDEX "servicos_active_name_idx" RENAME TO "itens_catalogo_active_name_idx";
