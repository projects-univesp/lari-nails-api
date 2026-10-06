CREATE TABLE "horarios_funcionamento" (
    "day_of_week" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "open_time" VARCHAR(5),
    "close_time" VARCHAR(5),
    "lunch_start" VARCHAR(5),
    "lunch_end" VARCHAR(5),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("day_of_week"),
    CONSTRAINT "horarios_funcionamento_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6)
);

CREATE TABLE "bloqueios_agenda" (
    "id" TEXT NOT NULL,
    "reason" VARCHAR(120) NOT NULL,
    "date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bloqueios_agenda_date_start_time_idx" ON "bloqueios_agenda"("date", "start_time");
