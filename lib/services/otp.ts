import { getDemoStore } from "@/lib/data/store";

const MOCK_OTP = process.env.MOCK_OTP ?? "123456";

export function sendOtp(phone: string): { provider: "mock"; maskedPhone: string; expiresInSeconds: number } {
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    throw new Error("Phone number must include 10 to 15 digits");
  }

  getDemoStore().otp.set(phone, {
    code: MOCK_OTP,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });

  return {
    provider: "mock",
    maskedPhone: maskPhone(phone),
    expiresInSeconds: 300
  };
}

export function verifyOtp(phone: string, otp: string): { verified: boolean; reason?: string } {
  const store = getDemoStore();
  const record = store.otp.get(phone);

  if (!record) return { verified: false, reason: "OTP not requested" };
  if (record.expiresAt < Date.now()) return { verified: false, reason: "OTP expired" };
  if (record.attempts >= 3) return { verified: false, reason: "Too many attempts" };

  record.attempts += 1;

  if (otp !== record.code) {
    store.otp.set(phone, record);
    return { verified: false, reason: "Invalid OTP" };
  }

  store.otp.delete(phone);
  return { verified: true };
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}*****${phone.slice(-2)}`;
}
