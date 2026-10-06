import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

type CheckField = {
  collection: string;
  field: string;
};

const fields: CheckField[] = [
  // users
  { collection: "users", field: "email" },
  { collection: "users", field: "passwordHash" },
  { collection: "users", field: "name" },
  { collection: "users", field: "role" },
  { collection: "users", field: "isActive" },
  { collection: "users", field: "failedLoginAttempts" },
  { collection: "users", field: "createdAt" },
  { collection: "users", field: "updatedAt" },
  { collection: "users", field: "lastLoginAt" },

  // employees
  { collection: "employees", field: "applicationRef" },
  { collection: "employees", field: "email" },
  { collection: "employees", field: "phone" },
  { collection: "employees", field: "status" },
  { collection: "employees", field: "currentStep" },
  { collection: "employees", field: "completedSteps" },
  { collection: "employees", field: "personalDetails" },
  { collection: "employees", field: "createdAt" },
  { collection: "employees", field: "updatedAt" },

  // documents
  { collection: "employeedocuments", field: "employeeId" },
  { collection: "employeedocuments", field: "documentType" },
  { collection: "employeedocuments", field: "fileName" },
  { collection: "employeedocuments", field: "mimeType" },
  { collection: "employeedocuments", field: "sizeBytes" },
  { collection: "employeedocuments", field: "url" },
  { collection: "employeedocuments", field: "version" },
  { collection: "employeedocuments", field: "isActive" },
  { collection: "employeedocuments", field: "uploadedBy" },

  // approvals
  { collection: "approvalhistories", field: "employeeId" },
  { collection: "approvalhistories", field: "fromStatus" },
  { collection: "approvalhistories", field: "toStatus" },
  { collection: "approvalhistories", field: "action" },
  { collection: "approvalhistories", field: "performedBy" },
  { collection: "approvalhistories", field: "performedByRole" },

  // notifications
  { collection: "notifications", field: "recipientType" },
  { collection: "notifications", field: "recipientId" },
  { collection: "notifications", field: "employeeId" },
  { collection: "notifications", field: "applicationRef" },
  { collection: "notifications", field: "type" },
  { collection: "notifications", field: "title" },
  { collection: "notifications", field: "body" },
  { collection: "notifications", field: "linkUrl" },

  // audit logs
  { collection: "auditlogs", field: "action" },
  { collection: "auditlogs", field: "entity" },
  { collection: "auditlogs", field: "entityId" },
  { collection: "auditlogs", field: "performedBy" },
  { collection: "auditlogs", field: "performedByName" },
  { collection: "auditlogs", field: "performedByRole" },
  { collection: "auditlogs", field: "details" },

  // departments
  { collection: "departments", field: "name" },
  { collection: "departments", field: "code" },
  { collection: "departments", field: "description" },
  { collection: "departments", field: "isActive" },

  // designations
  { collection: "designations", field: "code" },
  { collection: "designations", field: "name" },
  { collection: "designations", field: "departmentId" },
  { collection: "designations", field: "isActive" },
  { collection: "designations", field: "level" },

  // site locations
  { collection: "sitelocations", field: "name" },
  { collection: "sitelocations", field: "code" },
  { collection: "sitelocations", field: "city" },
  { collection: "sitelocations", field: "state" },
  { collection: "sitelocations", field: "isActive" },

  // id cards
  { collection: "idcards", field: "employeeId" },
  { collection: "idcards", field: "employeeIdCode" },
  { collection: "idcards", field: "url" },
  { collection: "idcards", field: "format" },
  { collection: "idcards", field: "status" },
  { collection: "idcards", field: "generatedAt" },

  // download logs
  { collection: "idcarddownloadlogs", field: "employeeId" },
  { collection: "idcarddownloadlogs", field: "employeeIdCode" },
  { collection: "idcarddownloadlogs", field: "employeeName" },
  { collection: "idcarddownloadlogs", field: "action" },
  { collection: "idcarddownloadlogs", field: "performedBy" },

  // settings
  { collection: "settings", field: "key" },
  { collection: "settings", field: "value" }
];

async function main() {
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  const db = mongoose.connection.db!;

  console.log("\n========================================");
  console.log("NULL / MISSING FIELD CHECK");
  console.log("========================================\n");

  for (const item of fields) {
    const collection = db.collection(item.collection);
    const total = await collection.countDocuments();

    const missing = await collection.countDocuments({
      [item.field]: { $exists: false }
    });

    const nullCount = await collection.countDocuments({
      [item.field]: null
    });

    console.log(
      `${item.collection}.${item.field} → total=${total}, missing=${missing}, null=${nullCount}`
    );
  }

  console.log("\n========================================");
  console.log("UNIQUENESS CHECK");
  console.log("========================================\n");

  const uniqueChecks = [
    ["users", "email"],
    ["employees", "applicationRef"],
    ["idcards", "employeeId"],
    ["settings", "key"]
  ];

  for (const [collectionName, field] of uniqueChecks) {
    const duplicates = await db
      .collection(collectionName)
      .aggregate([
        {
          $group: {
            _id: `$${field}`,
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        },
        { $limit: 10 }
      ])
      .toArray();

    console.log(
      `${collectionName}.${field} → ${
        duplicates.length === 0
          ? "NO DUPLICATES"
          : `${duplicates.length} duplicate groups found`
      }`
    );
  }

  console.log("\n========================================");
  console.log("REFERENCE TYPE CHECK");
  console.log("========================================\n");

  const references = [
    ["designations", "departmentId"],
    ["employeedocuments", "employeeId"],
    ["approvalhistories", "employeeId"],
    ["approvalhistories", "performedBy"],
    ["notifications", "recipientId"],
    ["notifications", "employeeId"],
    ["idcards", "employeeId"],
    ["idcarddownloadlogs", "employeeId"],
    ["idcarddownloadlogs", "performedBy"],
    ["auditlogs", "performedBy"]
  ];

  for (const [collectionName, field] of references) {
    const result = await db
      .collection(collectionName)
      .aggregate([
        {
          $project: {
            type: { $type: `$${field}` }
          }
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    console.log(`${collectionName}.${field}:`);

    for (const item of result) {
      console.log(`  ${item._id}: ${item.count}`);
    }
  }

  console.log("\n========================================");
  console.log("VALIDATION COMPLETE");
  console.log("========================================\n");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❌ Validation failed");

  if (error instanceof Error) {
    console.error(error.message);
  }

  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
