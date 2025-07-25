import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const keyHex = process.env.ENCRYPTION_KEY;

function encryptAESGCM(plaintext) {
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, encrypted, tag]);
  return payload.toString("base64");
}
