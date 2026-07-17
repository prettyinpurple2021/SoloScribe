import React, { useState } from 'react';
import posthog from 'posthog-js';
import { auth } from '../../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Rocket, ShieldCheck, Mail, Lock, UserPlus, HelpCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      posthog.capture(isNew ? 'user_signed_up' : 'user_signed_in', { method: 'google' });
      toast.success('AUTHENTICATED: ACCESS GRANTED');
    } catch (error) {
      posthog.captureException(error);
      console.error(error);
      toast.error('AUTHENTICATION FAILED: RETRYING...');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        posthog.capture('user_signed_up', { method: 'email' });
        toast.success('ACCOUNT CREATED: WELCOME FOUNDER');
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        posthog.capture('user_signed_in', { method: 'email' });
        toast.success('AUTHENTICATED: ACCESS GRANTED');
      } else {
        await sendPasswordResetEmail(auth, email);
        toast.success('RECOVERY LINK DISPATCHED TO: ' + email);
        setMode('signin');
      }
    } catch (error: any) {
      posthog.captureException(error);
      toast.error(error.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-neo-black p-10 neo-shadow-lg max-w-md w-full text-center transform -rotate-1 relative"
      >
        <div className="w-20 h-20 bg-neo-cyan border-4 border-neo-black mx-auto mb-8 flex items-center justify-center neo-shadow">
           <ShieldCheck className="w-10 h-10 text-neo-black" />
        </div>
        
        <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">
          {mode === 'signin' ? 'FOUNDER_CORE_ACCESS' : mode === 'signup' ? 'REGISTER_FOUNDER' : 'RECOVER_ACCESS'}
        </h2>
        <p className="font-mono text-xs font-bold text-zinc-500 mb-8 leading-relaxed">
          {mode === 'signin' 
            ? 'IDENTIFICATION REQUIRED. CONNECT YOUR FOUNDER IDENTITY TO UNLOCK THE INKLO ENGINE.'
            : mode === 'signup'
            ? 'INITIALIZE YOUR STRATEGY PROTOCOLS. CREATING A SOVEREIGN FOUNDER ID.'
            : 'FORGOTTEN PROTOCOLS? PROVIDE EMAIL FOR RECOVERY DISPATCH.'}
        </p>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
           <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="email" 
                placeholder="FOUNDER_EMAIL" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-50 border-2 border-neo-black p-3 pl-10 font-black outline-none focus:bg-neo-cyan/10 transition-colors"
              />
           </div>
           
           {mode !== 'forgot' && (
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="password" 
                  placeholder="SECURE_PHRASE" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-50 border-2 border-neo-black p-3 pl-10 font-black outline-none focus:bg-neo-cyan/10 transition-colors"
                />
             </div>
           )}

           <button
             type="submit"
             disabled={loading}
             className="w-full py-4 bg-neo-black text-neo-white font-black text-lg tracking-widest flex items-center justify-center gap-3 neo-shadow-hover transition-all hover:bg-zinc-800 disabled:opacity-50"
           >
             {loading ? <div className="w-6 h-6 border-4 border-neo-cyan border-t-transparent rounded-full animate-spin" /> : (
               <>
                 {mode === 'signin' ? <LogIn size={20} /> : mode === 'signup' ? <UserPlus size={20} /> : <HelpCircle size={20} />}
                 {mode === 'signin' ? 'AUTHORIZE' : mode === 'signup' ? 'INITIALIZE' : 'DISPATCH'}
               </>
             )}
           </button>
        </form>

        {mode === 'signin' && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[2px] bg-neo-black/10 flex-1" />
              <span className="font-mono text-[10px] font-black uppercase">OR</span>
              <div className="h-[2px] bg-neo-black/10 flex-1" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white border-2 border-neo-black text-neo-black font-black text-sm tracking-widest flex items-center justify-center gap-3 neo-shadow-hover transition-all hover:bg-zinc-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              GOOG_LINK_CONNECT
            </button>
          </>
        )}

        <div className="mt-8 pt-6 border-t-2 border-neo-black/10 flex flex-wrap gap-4 justify-center font-mono text-[10px] font-black uppercase">
          {mode === 'signin' ? (
            <>
              <button onClick={() => setMode('signup')} className="hover:text-neo-pink transition-colors">NEW_FOUNDER?</button>
              <button onClick={() => setMode('forgot')} className="hover:text-neo-cyan transition-colors">FORGOT_PHRASE?</button>
            </>
          ) : (
            <button onClick={() => setMode('signin')} className="flex items-center gap-2 hover:text-neo-pink transition-colors">
              <ArrowLeft size={12} /> BACK_TO_AUTH
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
