CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "servicos_price_cents_check" CHECK ("price_cents" >= 0),
    CONSTRAINT "servicos_duration_minutes_check" CHECK ("duration_minutes" BETWEEN 1 AND 1440)
);

CREATE INDEX "servicos_active_name_idx" ON "servicos"("active", "name");
