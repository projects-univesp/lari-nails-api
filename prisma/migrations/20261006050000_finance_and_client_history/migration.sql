ALTER TABLE "clientes"
  ADD COLUMN "birthday" VARCHAR(5),
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "agendamentos"
  DROP CONSTRAINT "agendamentos_status_check";

ALTER TABLE "agendamentos"
  ADD CONSTRAINT "agendamentos_status_check"
  CHECK ("status" IN ('AGUARDANDO', 'CONFIRMADO', 'REAGENDAMENTO_SUGERIDO', 'CANCELADO', 'CONCLUIDO'));

CREATE TABLE "pagamentos" (
  "id" TEXT NOT NULL,
  "appointment_id" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "method" VARCHAR(20),
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pagamentos_appointment_id_key" UNIQUE ("appointment_id"),
  CONSTRAINT "pagamentos_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "pagamentos_amount_cents_check" CHECK ("amount_cents" >= 0),
  CONSTRAINT "pagamentos_status_check" CHECK ("status" IN ('PENDENTE', 'RECEBIDO')),
  CONSTRAINT "pagamentos_method_check" CHECK ("method" IS NULL OR "method" IN ('PIX', 'CARTAO', 'DINHEIRO')),
  CONSTRAINT "pagamentos_received_fields_check" CHECK (("status" = 'RECEBIDO' AND "method" IS NOT NULL AND "paid_at" IS NOT NULL) OR ("status" = 'PENDENTE' AND "method" IS NULL AND "paid_at" IS NULL))
);

CREATE INDEX "pagamentos_status_paid_at_idx" ON "pagamentos"("status", "paid_at");

CREATE TABLE "etiquetas_clientes" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(40) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "etiquetas_clientes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "etiquetas_clientes_name_key" UNIQUE ("name")
);

INSERT INTO "etiquetas_clientes" ("id", "name") VALUES
  (gen_random_uuid()::text, 'VIP'),
  (gen_random_uuid()::text, 'Frequente'),
  (gen_random_uuid()::text, 'Nova'),
  (gen_random_uuid()::text, 'Devedora'),
  (gen_random_uuid()::text, 'Problemática');
