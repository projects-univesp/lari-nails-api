CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "requested_date" DATE NOT NULL,
    "requested_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO',
    "denial_reason" VARCHAR(500),
    "proposed_date" DATE,
    "proposed_time" VARCHAR(5),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agendamentos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_interval_check" CHECK ("start_at" < "end_at"),
    CONSTRAINT "agendamentos_status_check" CHECK ("status" IN ('AGUARDANDO', 'CONFIRMADO', 'REAGENDAMENTO_SUGERIDO', 'CANCELADO')),
    CONSTRAINT "agendamentos_source_check" CHECK ("source" IN ('MANUAL', 'WHATSAPP_BOT'))
);

CREATE INDEX "agendamentos_requested_date_status_idx" ON "agendamentos"("requested_date", "status");
CREATE INDEX "agendamentos_client_id_requested_date_idx" ON "agendamentos"("client_id", "requested_date");

ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_no_overlap"
    EXCLUDE USING gist (tsrange("start_at", "end_at", '[)') WITH &&)
    WHERE ("status" IN ('AGUARDANDO', 'CONFIRMADO'));

CREATE TABLE "historico_status_agendamento" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "from_status" VARCHAR(30),
    "to_status" VARCHAR(30) NOT NULL,
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" TEXT,
    "reason" VARCHAR(500),
    "proposed_date" DATE,
    "proposed_time" VARCHAR(5),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_agendamento_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "historico_status_agendamento_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "historico_status_agendamento_appointment_id_occurred_at_idx" ON "historico_status_agendamento"("appointment_id", "occurred_at");
