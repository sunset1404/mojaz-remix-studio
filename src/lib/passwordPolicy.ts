// Shared password policy used by signup & change-password flows.
// Catches the most common "weak/known" passwords client-side so Supabase HIBP
// rarely needs to reject — and when it does, we map the error to Arabic.

const COMMON_WEAK = new Set([
  "123456","1234567","12345678","123456789","1234567890",
  "password","password1","password123","qwerty","qwerty123",
  "111111","000000","abc123","iloveyou","admin","admin123",
  "welcome","letmein","monkey","dragon","sunshine","princess",
  "azerty","123123","654321","666666","123321","112233",
  "passw0rd","p@ssword","p@ssw0rd","qwertyuiop","asdfghjkl",
  "zxcvbnm","11111111","00000000","12341234","abcd1234",
]);

export interface PasswordCheck {
  valid: boolean;
  /** Arabic message shown inline under the field. Empty when valid. */
  message: string;
}

export function validatePassword(pwd: string): PasswordCheck {
  if (!pwd) return { valid: false, message: "كلمة المرور مطلوبة" };
  if (pwd.length < 8) return { valid: false, message: "كلمة المرور يجب ألا تقل عن 8 أحرف" };
  if (!/[A-Za-z]/.test(pwd)) return { valid: false, message: "يجب أن تحتوي على حرف واحد على الأقل" };
  if (!/[0-9]/.test(pwd)) return { valid: false, message: "يجب أن تحتوي على رقم واحد على الأقل" };
  if (/^(.)\1+$/.test(pwd)) return { valid: false, message: "كلمة المرور ضعيفة جداً" };
  const lower = pwd.toLowerCase();
  if (COMMON_WEAK.has(lower)) {
    return { valid: false, message: "كلمة المرور شائعة وسهلة التخمين، اختر كلمة مرور أقوى" };
  }
  // Sequential like 12345678 or abcdefgh
  if (/^(?:0123456789|1234567890|abcdefgh|qwertyui)/.test(lower)) {
    return { valid: false, message: "كلمة المرور شائعة وسهلة التخمين، اختر كلمة مرور أقوى" };
  }
  return { valid: true, message: "" };
}

/** Maps a raw error from Supabase/Edge function to a friendly Arabic message. */
export function mapAuthError(raw: string | undefined | null): string {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("weak") || msg.includes("pwned") || msg.includes("known to be")) {
    return "كلمة المرور ضعيفة وسهلة التخمين، يرجى اختيار كلمة مرور أقوى";
  }
  if (msg.includes("password should be at least") || msg.includes("too short")) {
    return "كلمة المرور قصيرة جداً";
  }
  return raw || "حدث خطأ، يرجى المحاولة مرة أخرى";
}

export function isPasswordError(raw: string | undefined | null): boolean {
  const msg = (raw || "").toLowerCase();
  return msg.includes("password") || msg.includes("weak") || msg.includes("pwned");
}
