import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    family: 4
  });

  const db = mongoose.connection.db!;

  console.log("\n========================================");
  console.log("BROKEN APPROVAL USER REFERENCES");
  console.log("========================================\n");

  const brokenApprovals = await db.collection("approvalhistories").aggregate([
    {
      $lookup: {
        from: "users",
        localField: "performedBy",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $match: {
        $expr: { $eq: [{ $size: "$user" }, 0] }
      }
    },
    {
      $project: {
        _id: 1,
        employeeId: 1,
        performedBy: 1,
        performedByRole: 1,
        action: 1,
        fromStatus: 1,
        toStatus: 1,
        createdAt: 1
      }
    }
  ]).toArray();

  for (const item of brokenApprovals) {
    console.log({
      id: item._id?.toString(),
      employeeId: item.employeeId?.toString(),
      performedBy: item.performedBy?.toString(),
      performedByRole: item.performedByRole,
      action: item.action,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      createdAt: item.createdAt
    });
  }

  console.log(`\nBroken approval records: ${brokenApprovals.length}`);

  console.log("\n========================================");
  console.log("BROKEN NOTIFICATION RECIPIENT REFERENCES");
  console.log("========================================\n");

  const brokenNotifications = await db.collection("notifications").aggregate([
    {
      $lookup: {
        from: "users",
        localField: "recipientId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $match: {
        $expr: { $eq: [{ $size: "$user" }, 0] }
      }
    },
    {
      $project: {
        _id: 1,
        recipientType: 1,
        recipientId: 1,
        employeeId: 1,
        applicationRef: 1,
        type: 1,
        title: 1,
        createdAt: 1
      }
    }
  ]).toArray();

  for (const item of brokenNotifications) {
    console.log({
      id: item._id?.toString(),
      recipientType: item.recipientType,
      recipientId: item.recipientId?.toString(),
      employeeId: item.employeeId?.toString(),
      applicationRef: item.applicationRef,
      type: item.type,
      title: item.title,
      createdAt: item.createdAt
    });
  }

  console.log(`\nBroken notification records: ${brokenNotifications.length}`);

  console.log("\n========================================");
  console.log("CURRENT USERS");
  console.log("========================================\n");

  const users = await db.collection("users")
    .find({})
    .project({
      _id: 1,
      email: 1,
      role: 1,
      isActive: 1
    })
    .toArray();

  for (const user of users) {
    console.log({
      id: user._id?.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  }

  console.log(`\nCurrent users: ${users.length}`);

  console.log("\n========================================");
  console.log("INSPECTION COMPLETE");
  console.log("========================================\n");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❌ Inspection failed");

  if (error instanceof Error) {
    console.error(error.message);
  }

  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
