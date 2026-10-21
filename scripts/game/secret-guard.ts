/** Reports locations only; values must never be copied into diagnostics. */
export function privilegedPublicNames(env: Record<string, string | undefined>): string[] {
  return Object.keys(env).filter(name => name.startsWith('VITE_') && /secret|service_role|signing|password|access_token/i.test(name));
}
export function containsPrivilegedValue(text: string, env: Record<string, string | undefined>): boolean {
  const privateValues = Object.entries(env).filter(([name, value]) => !name.startsWith('VITE_') && /(?:SERVICE_ROLE_KEY|SECRET_KEY|SIGNING_KEY|PRIVATE_KEY|ACCESS_TOKEN)$/.test(name) && !!value && value.length >= 16).map(([, value]) => value!);
  if (privateValues.some(value => text.includes(value))) return true;
  if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(text) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) return true;
  // Legacy Supabase privileged JWTs are also forbidden, regardless of env name.
  for (const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
    try { if (JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role') return true; } catch { /* Not a JWT. */ }
  }
  return false;
}
