import mongoose from "mongoose";

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection not available");
  }

  const employee = await db.collection("employees").findOne({
    _id: new mongoose.Types.ObjectId("6ab4d28d0affe1b815a9e4d8"),
  });

  if (!employee) {
    console.log("Employee was not found in MongoDB.");
  } else {
    console.log("Missing PostgreSQL employee found in MongoDB:");
    console.log({
      id: employee._id.toString(),
      applicationRef: employee.applicationRef,
      email: employee.email,
      phone: employee.phone,
      status: employee.status,
      currentStep: employee.currentStep,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("CHECK FAILED:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
