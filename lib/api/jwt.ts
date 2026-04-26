import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';

const ALG = 'HS256';
const TTL_DAYS = 30;

function secretKey(): Uint8Array {
  const s = process.env.LABHUB_JWT_SECRET;
  if (!s) throw new Error('LABHUB_JWT_SECRET not set');
  return new TextEncoder().encode(s);
}

export async function signMemberToken(memberLogin: string): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(memberLogin)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
  return { token, expiresAt };
}

export type VerifyResult =
  | { ok: true; memberLogin: string }
  | { ok: false; reason: 'missing_token' | 'invalid_token' | 'expired_token' };

export async function verifyMemberToken(token: string | null | undefined): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: 'missing_token' };
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (typeof payload.sub !== 'string' || !payload.sub) {
      return { ok: false, reason: 'invalid_token' };
    }
    return { ok: true, memberLogin: payload.sub };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired_token' };
    return { ok: false, reason: 'invalid_token' };
  }
}
