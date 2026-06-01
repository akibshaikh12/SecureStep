import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { isEmailJsConfigured, sendRegistrationOtp } from '../../services/emailjs';

const Register = () => {
  const navigate = useNavigate();
  const { completeRegistration } = useAuth();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const requestOtp = async () => {
    setError('');
    setInfo('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.requestRegistrationOtp({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (isEmailJsConfigured()) {
        await sendRegistrationOtp({
          email: data.email,
          name: form.name,
          otp: data.otp,
        });
        setInfo(`A 6-digit code was sent to ${data.email}. Check your inbox (and spam).`);
      } else if (import.meta.env.DEV) {
        setInfo(
          `Development mode (no EmailJS): your verification code is ${data.otp}. Add keys to frontend/.env to send real emails.`
        );
      } else {
        setError(
          'EmailJS is not configured. Add VITE_EMAILJS_* variables to frontend/.env and restart the app.'
        );
        return;
      }

      setStep('otp');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    requestOtp();
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    requestOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeRegistration({ email: form.email, otp });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={step === 'otp' ? Mail : Shield}
      title={step === 'otp' ? 'Verify your email' : 'Create account'}
      subtitle={
        step === 'otp'
          ? 'Enter the code we emailed you to finish signing up'
          : 'Set up SecureStep — email verification required'
      }
      footer={
        <p className="mt-8 text-center text-sm text-text-secondary">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {info && (
        <div className="mb-4">
          <Alert variant="success">{info}</Alert>
        </div>
      )}

      {step === 'form' ? (
        <form className="flex flex-1 flex-col gap-4" onSubmit={handleFormSubmit}>
          <Input label="Full name" value={form.name} onChange={set('name')} required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
          />
          <Input
            label="Confirm password"
            type="password"
            value={form.confirm}
            onChange={set('confirm')}
            required
          />
          <Button className="mt-2 w-full" size="lg" type="submit" disabled={loading}>
            {loading ? 'Sending code…' : 'Send verification code'}
          </Button>
        </form>
      ) : (
        <form className="flex flex-1 flex-col gap-4" onSubmit={handleVerifyOtp}>
          <Input
            label="Verification code"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg tracking-[0.3em]"
            required
          />
          <Button className="w-full" size="lg" type="submit" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify & create account'}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="text-sm font-medium text-brand-400 disabled:text-text-tertiary"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setOtp('');
              setError('');
              setInfo('');
            }}
            className="text-sm text-text-secondary hover:text-text"
          >
            Change email or password
          </button>
        </form>
      )}

    </AuthLayout>
  );
};

export default Register;
