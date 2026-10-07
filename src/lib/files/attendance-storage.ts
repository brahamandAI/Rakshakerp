import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getCloudinary } from "@/lib/cloudinary/config";
import { deleteDocumentFromCloudinary } from "@/lib/cloudinary/upload";

const ROOT = path.resolve(process.cwd(), "uploads", "attendance");
const KEY_PATTERN = /^[a-f0-9]{24}\.(xlsx|xls|pdf|doc|docx)$/;
const ATTENDANCE_FOLDER = "rakshak-eoms/attendance";

function attendanceStoragePath(storageKey: string): string {
  if (!KEY_PATTERN.test(storageKey)) {
    throw new Error("Invalid attendance file");
  }
  const full = path.resolve(ROOT, storageKey);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
  if (full !== path.resolve(ROOT, path.basename(storageKey)) || !full.startsWith(rootWithSep)) {
    throw new Error("Invalid attendance file");
  }
  return full;
}

function uploadAttendanceToCloudinary(
  buffer: Buffer,
  fileKey: string
): Promise<string> {
  if (!KEY_PATTERN.test(fileKey)) {
    throw new Error("Invalid attendance file");
  }

  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: ATTENDANCE_FOLDER,
        public_id: fileKey,
        resource_type: "raw",
        overwrite: false,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload did not return a secure URL"));
          return;
        }
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/** Stores the original file in Cloudinary and returns its private delivery URL. */
export async function saveAttendanceFile(
  fileKey: string,
  buffer: Buffer
): Promise<string> {
  return uploadAttendanceToCloudinary(buffer, fileKey);
}

export async function readAttendanceFile(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith("https://")) {
    const response = await fetch(storageKey);
    if (!response.ok) {
      throw new Error("Unable to read attendance file");
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return fs.readFile(attendanceStoragePath(storageKey));
}

export async function deleteAttendanceFile(storageKey: string): Promise<void> {
  if (storageKey.startsWith("https://")) {
    await deleteDocumentFromCloudinary(storageKey);
    return;
  }

  if (!KEY_PATTERN.test(storageKey)) return;
  await fs.unlink(attendanceStoragePath(storageKey)).catch(() => undefined);
}
