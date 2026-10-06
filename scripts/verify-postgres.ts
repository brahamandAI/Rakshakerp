import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n========================================");
  console.log("POSTGRESQL / NEON VERIFICATION");
  console.log("========================================\n");

  const [
    users,
    departments,
    designations,
    siteLocations,
    employees,
    employeeDocuments,
    approvalHistories,
    notifications,
    auditLogs,
    idCards,
    idCardDownloadLogs,
    settings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.designation.count(),
    prisma.siteLocation.count(),
    prisma.employee.count(),
    prisma.employeeDocument.count(),
    prisma.approvalHistory.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.idCard.count(),
    prisma.idCardDownloadLog.count(),
    prisma.setting.count(),
  ]);

  console.log("Table counts:");
  console.log("----------------------------------------");
  console.log(`users                : ${users}`);
  console.log(`departments          : ${departments}`);
  console.log(`designations         : ${designations}`);
  console.log(`site locations       : ${siteLocations}`);
  console.log(`employees            : ${employees}`);
  console.log(`employee documents   : ${employeeDocuments}`);
  console.log(`approval histories   : ${approvalHistories}`);
  console.log(`notifications        : ${notifications}`);
  console.log(`audit logs           : ${auditLogs}`);
  console.log(`id cards             : ${idCards}`);
  console.log(`id card download logs: ${idCardDownloadLogs}`);
  console.log(`settings             : ${settings}`);

  console.log("\n========================================");
  console.log("SAMPLE DATA CHECK");
  console.log("========================================\n");

  const user = await prisma.user.findFirst({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  console.log("Sample user:");
  console.log(user);

  const employee = await prisma.employee.findFirst({
    select: {
      id: true,
      applicationRef: true,
      email: true,
      phone: true,
      status: true,
      currentStep: true,
    },
  });

  console.log("\nSample employee:");
  console.log(employee);

  const department = await prisma.department.findFirst({
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  });

  console.log("\nSample department:");
  console.log(department);

  console.log("\n========================================");
  console.log("VERIFICATION COMPLETED");
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
