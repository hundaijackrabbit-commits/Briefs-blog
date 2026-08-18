import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export const READER_COOKIE="briefs_reader";

export function normalizeEmail(email:string){return email.trim().toLowerCase().slice(0,320);}

export function hashPassword(password:string){
  const salt=randomBytes(16);
  const derived=scryptSync(password,salt,32);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password:string,stored:string){
  const [scheme,saltHex,hashHex]=stored.split("$");
  if(scheme!=="scrypt"||!saltHex||!hashHex) return false;
  const expected=Buffer.from(hashHex,"hex");
  const actual=scryptSync(password,Buffer.from(saltHex,"hex"),expected.length);
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}

function tokenHash(token:string){return createHash("sha256").update(token).digest("hex");}

export async function createReaderSession(accountId:string){
  const token=randomBytes(32).toString("base64url");
  const sql=db();
  await sql`insert into reader_sessions(account_id,token_hash,expires_at) values(${accountId}::uuid,${tokenHash(token)},now()+interval '30 days')`;
  return token;
}

export async function readerFromToken(token:string|undefined){
  if(!token||!process.env.DATABASE_URL) return null;
  try{
    const sql=db();
    const rows=await sql`select a.id,a.email,a.created_at from reader_sessions s join reader_accounts a on a.id=s.account_id where s.token_hash=${tokenHash(token)} and s.expires_at>now() limit 1`;
    return rows[0]?{id:String(rows[0].id),email:String(rows[0].email),createdAt:new Date(rows[0].created_at).toISOString()}:null;
  }catch{return null;}
}

export async function readerFromRequest(request:NextRequest){return readerFromToken(request.cookies.get(READER_COOKIE)?.value);}

export async function revokeReaderSession(token:string|undefined){
  if(!token||!process.env.DATABASE_URL) return;
  const sql=db();
  await sql`delete from reader_sessions where token_hash=${tokenHash(token)}`;
}
