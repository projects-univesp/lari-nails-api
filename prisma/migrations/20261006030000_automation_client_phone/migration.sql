ALTER TABLE "clientes" ADD COLUMN "normalized_phone" VARCHAR(13);

-- Registros legados ambíguos permanecem sem chave para revisão manual.
WITH phones AS (
  SELECT id, deleted_at,
    CASE
      WHEN regexp_replace(telefone, '[^0-9]', '', 'g') ~ '^[1-9][0-9]{9,10}$'
        THEN '55' || regexp_replace(telefone, '[^0-9]', '', 'g')
      WHEN regexp_replace(telefone, '[^0-9]', '', 'g') ~ '^55[1-9][0-9]{9,10}$'
        THEN regexp_replace(telefone, '[^0-9]', '', 'g')
      ELSE NULL
    END AS phone
  FROM "clientes"
), unique_phones AS (
  SELECT phone FROM phones WHERE phone IS NOT NULL AND deleted_at IS NULL
  GROUP BY phone HAVING COUNT(*) = 1
)
UPDATE "clientes" c SET "normalized_phone" = p.phone
FROM phones p JOIN unique_phones u ON u.phone = p.phone
WHERE c.id = p.id AND p.deleted_at IS NULL;

CREATE UNIQUE INDEX "clientes_normalized_phone_key" ON "clientes"("normalized_phone");
