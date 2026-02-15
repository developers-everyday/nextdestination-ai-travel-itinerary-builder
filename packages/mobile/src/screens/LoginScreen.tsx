import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileInput } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const haptic = useHaptic();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      await haptic.error();
      setError(authError.message);
    } else {
      await haptic.success();
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    await haptic.light();
    await signInWithGoogle();
  };

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  return (
    <SafeAreaView className="min-h-screen bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <div className="flex items-center px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-8">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200 mx-auto mb-6 rotate-3">
            N
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500">Continue your journey with NextDestination</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <MobileInput
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            autoComplete="email"
          />

          <MobileInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            onRightIconClick={() => setShowPassword(!showPassword)}
            autoComplete="current-password"
          />

          <div className="text-right">
            <button className="text-sm font-medium text-blue-600">
              Forgot Password?
            </button>
          </div>

          <MobileButton
            fullWidth
            loading={isLoading}
            onClick={handleEmailLogin}
            hapticFeedback="medium"
            className="mt-6"
          >
            Sign In
          </MobileButton>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Or continue with
          </span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Google Login */}
        <MobileButton
          variant="outline"
          fullWidth
          onClick={handleGoogleLogin}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#4285F4"
              />
            </svg>
          }
        >
          Continue with Google
        </MobileButton>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Skip Button */}
      <div className="px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-slate-400 text-sm font-medium"
        >
          Skip & Browse
        </button>
      </div>
    </SafeAreaView>
  );
};
