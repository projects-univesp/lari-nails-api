-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "data_nasc" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email" VARCHAR(255);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
