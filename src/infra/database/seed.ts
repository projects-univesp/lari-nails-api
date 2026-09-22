import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/bookmarks_db?schema=public';

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const adminEmail = 'admin@bookmarks.com';
    const existing = await prisma.userModel.findUnique({
      where: { email: adminEmail },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.userModel.create({
        data: {
          nome: 'Administrador',
          email: adminEmail,
          senha: hashedPassword,
          role: 'admin',
        },
      });
      console.log(
        'Usuario administrador criado com sucesso: admin@bookmarks.com / admin123',
      );
    } else {
      console.log('Usuario administrador ja existe.');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void seed();
