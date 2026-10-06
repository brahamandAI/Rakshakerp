import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n========================================");
  console.log("POSTGRESQL RELATIONSHIP VERIFICATION");
  console.log("========================================\n");

  const [
    brokenDesignations,
    brokenDocuments,
    brokenApprovalEmployees,
    brokenApprovalUsers,
    brokenNotificationEmployees,
    brokenNotificationUsers,
    brokenIdCards,
    brokenDownloadEmployees,
    brokenDownloadUsers,
    brokenAuditUsers,
  ] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM designations d
      LEFT JOIN departments dep ON dep.id = d."departmentId"
      WHERE dep.id IS NULL
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM employeedocuments ed
      LEFT JOIN employees e ON e.id = ed."employeeId"
      WHERE e.id IS NULL
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM approvalhistories ah
      LEFT JOIN employees e ON e.id = ah."employeeId"
      WHERE e.id IS NULL
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM approvalhistories ah
      WHERE ah."performedBy" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.id = ah."performedBy"
        )
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM notifications n
      WHERE n."employeeId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM employees e
          WHERE e.id = n."employeeId"
        )
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM notifications n
      WHERE n."recipientId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.id = n."recipientId"
        )
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM idcards i
      LEFT JOIN employees e ON e.id = i."employeeId"
      WHERE e.id IS NULL
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM idcarddownloadlogs dl
      LEFT JOIN employees e ON e.id = dl."employeeId"
      WHERE e.id IS NULL
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM idcarddownloadlogs dl
      WHERE NOT EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = dl."performedBy"
      )
    `,

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM auditlogs a
      WHERE a."performedBy" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.id = a."performedBy"
        )
    `,
  ]);

  const checks = [
    ["Designations → Departments", brokenDesignations[0].count],
    ["Documents → Employees", brokenDocuments[0].count],
    ["Approval Histories → Employees", brokenApprovalEmployees[0].count],
    ["Approval Histories → Users", brokenApprovalUsers[0].count],
    ["Notifications → Employees", brokenNotificationEmployees[0].count],
    ["Notifications → Users", brokenNotificationUsers[0].count],
    ["ID Cards → Employees", brokenIdCards[0].count],
    ["Download Logs → Employees", brokenDownloadEmployees[0].count],
    ["Download Logs → Users", brokenDownloadUsers[0].count],
    ["Audit Logs → Users", brokenAuditUsers[0].count],
  ];

  console.log("Relationship checks:");
  console.log("----------------------------------------");

  let hasBroken = false;

  for (const [name, count] of checks) {
    const value = Number(count);

    if (value === 0) {
      console.log(`✅ ${name}: 0 broken`);
    } else {
      console.log(`⚠️ ${name}: ${value} broken`);
      hasBroken = true;
    }
  }

  console.log("\n========================================");

  if (hasBroken) {
    console.log("⚠️ RELATIONSHIP CHECK COMPLETED");
    console.log("Some historical references are missing.");
    console.log("This may be expected for legacy MongoDB records.");
  } else {
    console.log("✅ ALL RELATIONSHIPS VALID");
  }

  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Relationship verification failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
