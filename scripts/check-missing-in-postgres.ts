import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        applicationRef: "RS-APP-20260924-6Y17",
      },
      select: {
        id: true,
        applicationRef: true,
        email: true,
        phone: true,
        status: true,
        currentStep: true,
      },
    });

    if (employee) {
      console.log("FOUND IN POSTGRESQL:");
      console.log(employee);
    } else {
      console.log("NOT FOUND IN POSTGRESQL");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
