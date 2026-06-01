import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verify2FA(code);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title="Verification code"
      subtitle="Enter the 6-digit code from your authenticator app"
      footer={
        <>
          <p className="auth-demo-chip">Demo code: 123456</p>
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
              Back to sign in
            </Link>
          </p>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Authentication code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="text-center text-lg tracking-[0.3em]"
          required
        />
        <Button className="mt-2 w-full" size="lg" type="submit" disabled={loading || code.length < 6}>
          {loading ? 'Verifying…' : 'Verify and continue'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default TwoFactorAuth;
