import mongoose from "mongoose";

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

  const employee = await db.collection("employees").findOne({
    _id: new mongoose.Types.ObjectId("6ab4da1f0affe1b815a9f220"),
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  console.log(
    JSON.stringify(
      {
        id: employee._id.toString(),
        applicationRef: employee.applicationRef,
        email: employee.email,
        phone: employee.phone,
        status: employee.status,
        currentStep: employee.currentStep,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
