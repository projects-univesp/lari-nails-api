CREATE TABLE "eventos_automacao" (
  "id" TEXT NOT NULL,
  "type" VARCHAR(80) NOT NULL,
  "aggregate_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_until" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "last_error" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eventos_automacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eventos_automacao_delivered_at_next_attempt_at_idx"
  ON "eventos_automacao"("delivered_at", "next_attempt_at");
