import argon2 from "argon2";
import crypto from "crypto";

export async function generateHash(text: string) {
  const salt = crypto.randomBytes(32);
  const hash = await argon2.hash(text, { salt, type: argon2.argon2d });
  return hash;
}

export async function verifyHash(hash: string, plainText: string) {
  return await argon2.verify(hash, plainText);
}
