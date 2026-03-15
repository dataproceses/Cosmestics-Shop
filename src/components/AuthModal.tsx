import React from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError(null);
    setMessage(null);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, googleProvider);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
        onSuccess?.();
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        setMessage('Account created! Please check your email for verification.');
        // Don't close immediately so they can see the message
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 z-10 flex flex-col md:flex-row"
        >
          {/* Left Side - Visual (Desktop Only) */}
          <div className="hidden md:block w-1/2 relative bg-stone-900 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1596462502278-27bfad450516?auto=format&fit=crop&q=80&w=1000" 
              alt="Cosmetics" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
            <div className="absolute bottom-12 left-12 right-12 text-white">
              <span className="serif text-xl font-bold tracking-tighter mb-4 block">COSMETICS</span>
              <h3 className="serif text-3xl font-bold mb-4 leading-tight">Elevate Your Beauty Ritual</h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                Join our community of beauty enthusiasts and discover a world of premium skincare and cosmetics curated just for you.
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors z-20"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-12">
              <div className="text-center md:text-left mb-8">
                <h2 className="serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm">
                  {mode === 'login' && 'Sign in to your account to continue'}
                  {mode === 'signup' && 'Join us for a premium beauty experience'}
                  {mode === 'forgot-password' && 'Enter your email to receive a reset link'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-3 text-emerald-600 text-sm">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm sm:text-base"
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Password</label>
                      {mode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-xs font-medium text-stone-500 hover:text-stone-900"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 text-white py-3 sm:py-4 rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Sign In'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'forgot-password' && 'Send Reset Link'}
                      </span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && (
                <>
                  <div className="relative my-6 sm:my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-stone-400 font-medium tracking-widest">Or continue with</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white border border-stone-200 text-stone-700 py-3 sm:py-4 rounded-xl font-bold hover:bg-stone-50 transition-all flex items-center justify-center space-x-3"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span>Google Account</span>
                  </button>
                </>
              )}

              <div className="mt-8 text-center md:text-left">
                <p className="text-sm text-stone-500">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => { setMode('signup'); setError(null); setMessage(null); }} className="font-bold text-stone-900 hover:underline">
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="font-bold text-stone-900 hover:underline">
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
