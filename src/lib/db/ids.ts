import crypto from "crypto";

/** 24-char lowercase hex id compatible with legacy Mongo ObjectId strings. */
export function newObjectIdString(): string {
  return crypto.randomBytes(12).toString("hex");
}
