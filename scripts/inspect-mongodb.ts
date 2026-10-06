import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function main() {
  try {
    console.log("Connecting to MongoDB...\n");

    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });

    console.log("✅ Connected");
    console.log(`Database: ${mongoose.connection.db?.databaseName}\n`);

    const db = mongoose.connection.db!;

    const collections = await db.listCollections().toArray();

    console.log("========================================");
    console.log("MONGODB COLLECTIONS");
    console.log("========================================\n");

    for (const collection of collections) {
      const name = collection.name;
      const count = await db.collection(name).countDocuments();

      console.log(`${name}: ${count}`);
    }

    console.log("\n========================================");
    console.log("FIELD TYPES");
    console.log("========================================\n");

    const collectionsToInspect = [
      "users",
      "employees",
      "employeedocuments",
      "approvalhistories",
      "notifications",
      "auditlogs",
      "departments",
      "designations",
      "sitelocations",
      "idcards",
      "idcarddownloadlogs",
      "settings",
    ];

    for (const name of collectionsToInspect) {
      const exists = collections.some((c) => c.name === name);

      if (!exists) {
        console.log(`\n${name}: collection not found`);
        continue;
      }

      const sample = await db.collection(name).findOne();

      console.log(`\n--- ${name} ---`);

      if (!sample) {
        console.log("Empty collection");
        continue;
      }

      for (const [field, value] of Object.entries(sample)) {
        let type: string = typeof value;

        if (value === null) {
          type = "null";
        } else if (value instanceof mongoose.Types.ObjectId) {
          type = "ObjectId";
        } else if (value instanceof Date) {
          type = "Date";
        } else if (Array.isArray(value)) {
          type = "Array";
        } else if (typeof value === "object") {
          type = "Object";
        }

        console.log(`  ${field}: ${type}`);
      }
    }

    console.log("\n========================================");
    console.log("INSPECTION COMPLETE");
    console.log("========================================");

  } catch (error) {
    console.error("\n❌ MongoDB inspection failed");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();

