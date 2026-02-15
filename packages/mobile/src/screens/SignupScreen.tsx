import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileInput } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';

export const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signUpWithEmail } = useAuth();
  const haptic = useHaptic();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      await haptic.error();
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      await haptic.error();
      return;
    }

    setIsLoading(true);

    const { error: authError } = await signUpWithEmail(email, password);

    if (authError) {
      await haptic.error();
      setError(authError.message);
    } else {
      await haptic.success();
      setSuccess(true);
    }

    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
    await haptic.light();
    await signInWithGoogle();
  };

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  if (success) {
    return (
      <SafeAreaView className="min-h-screen bg-white flex items-center justify-center" edges={['top', 'bottom']}>
        <div className="px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
          <p className="text-slate-500 mb-8">
            We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox to verify your account.
          </p>
          <MobileButton fullWidth onClick={() => navigate('/login')}>
            Go to Login
          </MobileButton>
        </div>
      </SafeAreaView>
    );
  }

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

      <div className="flex-1 px-6 pt-4 overflow-y-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-500">Start planning your dream trips</p>
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
            label="Name (Optional)"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            autoComplete="name"
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            onRightIconClick={() => setShowPassword(!showPassword)}
            autoComplete="new-password"
          />

          <MobileInput
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            autoComplete="new-password"
          />

          <MobileButton
            fullWidth
            loading={isLoading}
            onClick={handleSignup}
            hapticFeedback="medium"
            className="mt-6"
          >
            Create Account
          </MobileButton>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Or
          </span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Google Signup */}
        <MobileButton
          variant="outline"
          fullWidth
          onClick={handleGoogleSignup}
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

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-slate-400">
          By creating an account, you agree to our{' '}
          <button className="text-blue-600">Terms of Service</button> and{' '}
          <button className="text-blue-600">Privacy Policy</button>
        </p>

        {/* Login Link */}
        <div className="mt-6 mb-8 text-center">
          <p className="text-slate-500 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </SafeAreaView>
  );
};
