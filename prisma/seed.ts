import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@gianreseller.com" },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@gianreseller.com",
        password: await bcrypt.hash("admin123", 12),
        role: "ADMIN",
      },
    });
    console.log("Admin creado: admin@gianreseller.com / admin123");
  } else {
    console.log("Admin ya existe.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
