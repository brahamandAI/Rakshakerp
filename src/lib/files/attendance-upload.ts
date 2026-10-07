import { ATTENDANCE_MAX_BYTES } from "@/features/attendance/constants";
import type { AttendanceFileKind } from "@/features/attendance/constants";

const EXTENSIONS: Record<string, AttendanceFileKind> = {
  xlsx: "EXCEL",
  xls: "EXCEL",
  pdf: "PDF",
  doc: "WORD",
  docx: "WORD",
};

const MIME_BY_EXTENSION: Record<string, string[]> = {
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/zip",
    "application/octet-stream",
    "",
  ],
  xls: [
    "application/vnd.ms-excel",
    "application/octet-stream",
    "",
  ],
  pdf: ["application/pdf", "application/octet-stream", ""],
  doc: ["application/msword", "application/octet-stream", ""],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/octet-stream",
    "",
  ],
};

const CANONICAL_MIME: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export interface InspectedAttendanceFile {
  fileName: string;
  extension: string;
  fileType: AttendanceFileKind;
  mimeType: string;
}

export class AttendanceFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceFileError";
  }
}

export function sanitizeAttendanceFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "";
  const cleaned = base.replace(/[^\w.\- ()]/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 180);
}

function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1] ?? "";
}

function hasPdfMagic(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

function hasZipMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

function hasOleMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

export function inspectAttendanceUpload(
  fileName: string,
  reportedMime: string | undefined,
  buffer: Buffer
): InspectedAttendanceFile {
  const safeName = sanitizeAttendanceFileName(fileName);
  const extension = extensionOf(safeName);
  const fileType = EXTENSIONS[extension];

  if (!safeName || !fileType) {
    throw new AttendanceFileError(
      "Only Excel (.xlsx, .xls), PDF (.pdf), and Word (.doc, .docx) files are allowed."
    );
  }

  if (buffer.length === 0) {
    throw new AttendanceFileError("The selected file is empty.");
  }

  if (buffer.length > ATTENDANCE_MAX_BYTES) {
    throw new AttendanceFileError("File exceeds the 5 MB upload limit.");
  }

  const mime = (reportedMime ?? "").trim().toLowerCase();
  const allowedMimes = MIME_BY_EXTENSION[extension] ?? [];
  if (!allowedMimes.includes(mime)) {
    throw new AttendanceFileError(
      "Only Excel (.xlsx, .xls), PDF (.pdf), and Word (.doc, .docx) files are allowed."
    );
  }

  const magicOk =
    (extension === "pdf" && hasPdfMagic(buffer)) ||
    ((extension === "xlsx" || extension === "docx") && hasZipMagic(buffer)) ||
    ((extension === "xls" || extension === "doc") && hasOleMagic(buffer));

  if (!magicOk) {
    throw new AttendanceFileError(
      "The file content does not match its extension."
    );
  }

  return {
    fileName: safeName,
    extension,
    fileType,
    mimeType: CANONICAL_MIME[extension] ?? mime,
  };
}
