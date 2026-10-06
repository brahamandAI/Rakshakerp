import mongoose from "mongoose";

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);

  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection not available");
  }

  const employees = db.collection("employees");

  const employeeIdDupes = await employees
    .aggregate([
      {
        $match: {
          employeeId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
    .toArray();

  const temporaryEmployeeIdDupes = await employees
    .aggregate([
      {
        $match: {
          temporaryEmployeeId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$temporaryEmployeeId",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
    .toArray();

  console.log("");
  console.log("Duplicate employeeId values:");
  console.log(employeeIdDupes);

  console.log("");
  console.log("Duplicate temporaryEmployeeId values:");
  console.log(temporaryEmployeeIdDupes);

  console.log("");
  console.log("Counts:");
  console.log("employeeId duplicates:", employeeIdDupes.length);
  console.log(
    "temporaryEmployeeId duplicates:",
    temporaryEmployeeIdDupes.length
  );

  await mongoose.disconnect();

  console.log("");
  console.log("MongoDB check completed.");
}

main().catch(async (error) => {
  console.error("CHECK FAILED:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
