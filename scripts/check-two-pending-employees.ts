import mongoose from "mongoose";

const APPLICATION_REFS = [
  "RS-APP-20260924-URZN",
  "RS-APP-20260924-AESW",
];

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection not available");
  }

  const employees = await db
    .collection("employees")
    .find({
      applicationRef: { $in: APPLICATION_REFS },
    })
    .project({
      _id: 1,
      applicationRef: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .toArray();

  console.log("Pending employees:");

  for (const employee of employees) {
    console.log({
      id: employee._id?.toString(),
      applicationRef: employee.applicationRef,
      status: employee.status,
      currentStep: employee.currentStep,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
