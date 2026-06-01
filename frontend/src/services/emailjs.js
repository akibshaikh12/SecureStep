import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function isEmailJsConfigured() {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

/**
 * Sends registration OTP via EmailJS.
 * Template should include variables: to_email, to_name, otp_code, app_name
 */
export async function sendRegistrationOtp({ email, name, otp }) {
  if (!isEmailJsConfigured()) {
    throw new Error(
      'EmailJS is not configured. Add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to frontend/.env'
    );
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: email,
      to_name: name || 'User',
      otp_code: otp,
      app_name: 'SecureStep',
      message: `Your SecureStep verification code is ${otp}. It expires in 10 minutes.`,
    },
    PUBLIC_KEY
  );
}
