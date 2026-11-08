/**
 * Authentication & Security Service
 * Handles password verification, default password ('123456'),
 * localStorage persistence, and Email OTP (One-Time Password) generation & validation.
 */

export const DEFAULT_INITIAL_PASSWORD = '123456';

const PASSWORDS_STORAGE_KEY = 'hospital_user_passwords_v1';
const OTPS_STORAGE_KEY = 'hospital_active_otps_v1';
const EMAIL_LOGS_KEY = 'hospital_simulated_email_dispatches_v1';

export interface ActiveOtpData {
  email: string;
  code: string;
  expiresAt: number; // timestamp ms
  createdAt: number;
}

export interface SimulatedEmailDispatch {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  otpCode: string;
  dispatchedAt: string;
  expiresAt: string;
}

/**
 * Retrieve user's saved password, or fallback to the initial default '123456'
 */
export const getUserPassword = (emailOrId: string): string => {
  if (!emailOrId) return DEFAULT_INITIAL_PASSWORD;
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) {
      const map: Record<string, string> = JSON.parse(raw);
      const cleanKey = emailOrId.trim().toLowerCase();
      if (map[cleanKey]) {
        return map[cleanKey];
      }
    }
  } catch (e) {
    console.error('Failed to read saved passwords from localStorage', e);
  }
  return DEFAULT_INITIAL_PASSWORD;
};

/**
 * Verify whether an entered password matches the stored password or the default '123456'
 */
export const verifyPassword = (emailOrId: string, passwordAttempt: string): boolean => {
  const currentPassword = getUserPassword(emailOrId);
  return passwordAttempt.trim() === currentPassword;
};

/**
 * Update and persist a new password for a user (by email and optional staff ID)
 */
export const updateUserPassword = (
  email: string,
  newPassword: string,
  secondaryKey?: string
): boolean => {
  if (!newPassword || newPassword.trim().length === 0) return false;
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};

    const cleanEmail = email.trim().toLowerCase();
    map[cleanEmail] = newPassword.trim();

    if (secondaryKey) {
      const cleanSec = secondaryKey.trim().toLowerCase();
      map[cleanSec] = newPassword.trim();
    }

    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(map));
    
    // Clear active OTP for this email
    clearOtp(email);
    return true;
  } catch (e) {
    console.error('Failed to save updated password to localStorage', e);
    return false;
  }
};

/**
 * Generate a 6-digit numeric OTP and simulate dispatch to user's registered email
 */
export const generateAndSendOtp = (
  email: string,
  userName: string = 'Hospital Staff'
): { otp: string; expiresAt: number; emailDispatch: SimulatedEmailDispatch } => {
  const cleanEmail = email.trim().toLowerCase();
  
  // Generate random 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const validityMinutes = 10;
  const expiresAt = now + validityMinutes * 60 * 1000;

  // Persist active OTP
  try {
    const raw = localStorage.getItem(OTPS_STORAGE_KEY);
    const otps: Record<string, ActiveOtpData> = raw ? JSON.parse(raw) : {};
    otps[cleanEmail] = {
      email: cleanEmail,
      code: otp,
      expiresAt,
      createdAt: now
    };
    localStorage.setItem(OTPS_STORAGE_KEY, JSON.stringify(otps));
  } catch (e) {
    console.error('Failed to save OTP to localStorage', e);
  }

  // Record simulated email dispatch
  const emailDispatch: SimulatedEmailDispatch = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: cleanEmail,
    recipientName: userName,
    subject: 'Hospital Security Center: Your Password Reset Verification Code (OTP)',
    otpCode: otp,
    dispatchedAt: new Date().toLocaleTimeString(),
    expiresAt: new Date(expiresAt).toLocaleTimeString()
  };

  try {
    const rawEmails = localStorage.getItem(EMAIL_LOGS_KEY);
    const emailList: SimulatedEmailDispatch[] = rawEmails ? JSON.parse(rawEmails) : [];
    emailList.unshift(emailDispatch);
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(emailList.slice(0, 50)));
  } catch (e) {
    console.error('Failed to log simulated email', e);
  }

  return { otp, expiresAt, emailDispatch };
};

/**
 * Verify whether an entered OTP is valid and unexpired
 */
export const verifyOtp = (
  email: string,
  enteredOtp: string
): { success: boolean; message?: string } => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = enteredOtp.trim();

  if (!cleanCode || cleanCode.length < 6) {
    return { success: false, message: 'Please enter the full 6-digit OTP code.' };
  }

  try {
    const raw = localStorage.getItem(OTPS_STORAGE_KEY);
    if (!raw) {
      return { success: false, message: 'No OTP code was requested for this email. Please request a new code.' };
    }

    const otps: Record<string, ActiveOtpData> = JSON.parse(raw);
    const otpData = otps[cleanEmail];

    if (!otpData) {
      return { success: false, message: 'No active OTP code found for this email. Please request a new code.' };
    }

    if (Date.now() > otpData.expiresAt) {
      return { success: false, message: 'This OTP verification code has expired. Please request a new one.' };
    }

    if (otpData.code !== cleanCode) {
      return { success: false, message: 'Invalid OTP code. Please check the code dispatched to your email.' };
    }

    return { success: true };
  } catch (e) {
    console.error('Failed to verify OTP', e);
    return { success: false, message: 'An error occurred while validating the OTP code.' };
  }
};

/**
 * Clear stored OTP once used
 */
export const clearOtp = (email: string): void => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const raw = localStorage.getItem(OTPS_STORAGE_KEY);
    if (raw) {
      const otps: Record<string, ActiveOtpData> = JSON.parse(raw);
      delete otps[cleanEmail];
      localStorage.setItem(OTPS_STORAGE_KEY, JSON.stringify(otps));
    }
  } catch (e) {
    console.error('Failed to clear OTP', e);
  }
};
