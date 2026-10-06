import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function checkReference(
  collectionName: string,
  field: string,
  targetCollection: string
) {
  const db = mongoose.connection.db!;

  const broken = await db.collection(collectionName).aggregate([
    {
      $match: {
        [field]: { $type: "objectId" }
      }
    },
    {
      $lookup: {
        from: targetCollection,
        localField: field,
        foreignField: "_id",
        as: "_target"
      }
    },
    {
      $match: {
        $expr: { $eq: [{ $size: "$_target" }, 0] }
      }
    },
    {
      $project: {
        _id: 1,
        [field]: 1
      }
    },
    { $limit: 20 }
  ]).toArray();

  const total = await db.collection(collectionName).countDocuments({
    [field]: { $type: "objectId" }
  });

  console.log(
    `${collectionName}.${field} → ${total} references, broken: ${broken.length}`
  );

  if (broken.length > 0) {
    console.log("  Broken references:");
    for (const item of broken) {
      console.log(`  ${JSON.stringify(item)}`);
    }
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    family: 4
  });

  console.log("\n========================================");
  console.log("REFERENCE INTEGRITY CHECK");
  console.log("========================================\n");

  await checkReference(
    "designations",
    "departmentId",
    "departments"
  );

  await checkReference(
    "employeedocuments",
    "employeeId",
    "employees"
  );

  await checkReference(
    "approvalhistories",
    "employeeId",
    "employees"
  );

  await checkReference(
    "approvalhistories",
    "performedBy",
    "users"
  );

  await checkReference(
    "notifications",
    "recipientId",
    "users"
  );

  await checkReference(
    "notifications",
    "employeeId",
    "employees"
  );

  await checkReference(
    "idcards",
    "employeeId",
    "employees"
  );

  await checkReference(
    "idcarddownloadlogs",
    "employeeId",
    "employees"
  );

  await checkReference(
    "idcarddownloadlogs",
    "performedBy",
    "users"
  );

  await checkReference(
    "auditlogs",
    "performedBy",
    "users"
  );

  console.log("\n========================================");
  console.log("CHECK COMPLETE");
  console.log("========================================\n");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❌ Check failed");

  if (error instanceof Error) {
    console.error(error.message);
  }

  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
