import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/state';
import { auth } from '../lib/firebase';
import { verifyBeforeUpdateEmail, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { Bell, Shield, User, Globe, Trash2, Zap, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const UserSettings = () => {
  const { 
    founderMood, 
    setFounderMood, 
    notificationPreferences,
    founderIdentity,
    setFounderIdentity
  } = useAppStore();

  const moods = ['PRODUCTIVE', 'HYPER-FOCUSED', 'CHAOTIC', 'STRATEGIC', 'GOD_MODE'];

  const updateIdentity = async (field: keyof typeof founderIdentity, value: string) => {
    const updatedIdentity = {
      ...founderIdentity,
      [field]: value
    };
    
    setFounderIdentity(updatedIdentity);

    // Sync with Firestore if authenticated
    if (auth.currentUser) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          founderIdentity: updatedIdentity
        }, { merge: true });
      } catch (error) {
        console.error('Identity Sync Failure:', error);
      }
    }
  };

  const handleUpdateEmail = async () => {
    const newEmail = window.prompt('ENTER_NEW_FOUNDER_EMAIL:');
    if (!newEmail || !newEmail.includes('@')) {
      if (newEmail) toast.error('INVALID_EMAIL_FORMAT');
      return;
    }

    if (!auth.currentUser) return;

    try {
      toast.loading('DISPATCHING_VERIFICATION_LINK...', { id: 'email-update' });
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      toast.success('VERIFICATION_DISPATCHED: CHECK YOUR NEW INBOX', { id: 'email-update' });
    } catch (error: any) {
      toast.error(error.message.replace('Firebase:', '').trim(), { id: 'email-update' });
    }
  };

  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    if (!window.confirm('DISPATCH_PASSWORD_RESET_PROTOCOL_TO: ' + email + '?')) return;

    try {
      toast.loading('COMMUNICATING_WITH_AUTH_SERVER...', { id: 'pwd-reset' });
      await sendPasswordResetEmail(auth, email);
      toast.success('RECOVERY_LINK_DISPATCHED', { id: 'pwd-reset' });
    } catch (error: any) {
      toast.error(error.message.replace('Firebase:', '').trim(), { id: 'pwd-reset' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;

    const confirmation = window.prompt('WARNING: THIS_PROTOCOL_IS_IRREVERSIBLE. TYPE "DELETE" TO PURGE ALL FOUNDER DATA:');
    if (confirmation !== 'DELETE') {
      if (confirmation) toast.error('DATA_PURGE_ABORTED: INCORRECT_CONFIRMATION');
      return;
    }

    try {
      toast.loading('EXECUTING_DATA_PURGE...', { id: 'delete-acc' });
      await deleteUser(auth.currentUser);
      toast.success('IDENTITY_PURGED: GOODBYE FOUNDER');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('SECURITY_GATE_ACTIVE: PLEASE SIGN OUT AND SIGN BACK IN TO RE-AUTHENTICATE BEFORE DELETING.', { id: 'delete-acc' });
      } else {
        toast.error(error.message.replace('Firebase:', '').trim(), { id: 'delete-acc' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg mb-8">
         <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <User size={32} className="text-neo-cyan" />
            FOUNDER_CORE_SETTINGS
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* MOOD CONTROL */}
         <section className="bg-white border-4 border-neo-black p-6 neo-shadow">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-neo-black pb-2">
               <Zap className="text-neo-yellow" size={20} />
               MOOD_CALIBRATION
            </h3>
            <div className="flex flex-wrap gap-2">
               {moods.map(mood => (
                  <button
                     key={mood}
                     onClick={() => setFounderMood(mood)}
                     className={`px-4 py-2 border-2 border-neo-black font-black text-xs transition-all
                        ${founderMood === mood ? 'bg-neo-cyan shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-zinc-100'}
                     `}
                  >
                     {mood}
                  </button>
               ))}
            </div>
         </section>

         {/* NOTIFICATIONS */}
         <section className="bg-neo-lime border-4 border-neo-black p-6 neo-shadow">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-neo-black pb-2">
               <Bell size={20} />
               SYNC_NOTIFICATIONS
            </h3>
            <div className="flex flex-col gap-4">
               {['DESKTOP_PUSH', 'EMAIL_DIGEST', 'MOBILE_LINK'].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                     <div className="w-6 h-6 border-2 border-neo-black bg-white group-hover:bg-neo-cyan transition-all flex items-center justify-center font-black text-[10px]">
                        X
                     </div>
                     <span className="font-extrabold text-sm">{type}</span>
                  </label>
               ))}
            </div>
         </section>

         {/* IDENTITY CORE */}
         <section className="bg-neo-black text-neo-white border-4 border-neo-black p-6 neo-shadow col-span-1 md:col-span-2">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-neo-white pb-2">
               <Globe className="text-neo-cyan" size={20} />
               STRATEGIC_IDENTITY_CORE
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="font-mono text-[10px] font-black uppercase text-zinc-400">THE_WHY // PERSISTENT_MOTIVATION</label>
                  <textarea 
                    value={founderIdentity.why}
                    onChange={(e) => updateIdentity('why', e.target.value)}
                    placeholder="Why are you building this?"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 font-bold text-sm focus:border-neo-cyan outline-none transition-colors min-h-[80px]"
                  />
               </div>
               <div className="space-y-2">
                  <label className="font-mono text-[10px] font-black uppercase text-zinc-400">LONG_TERM_VISION // NORTH_STAR</label>
                  <textarea 
                    value={founderIdentity.vision}
                    onChange={(e) => updateIdentity('vision', e.target.value)}
                    placeholder="Where do you see this in 5 years?"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 font-bold text-sm focus:border-neo-cyan outline-none transition-colors min-h-[80px]"
                  />
               </div>
               <div className="space-y-2">
                  <label className="font-mono text-[10px] font-black uppercase text-zinc-400">OPERATIONAL_CONSTRAINTS // BOUNDARY_LOGIC</label>
                  <textarea 
                    value={founderIdentity.constraints}
                    onChange={(e) => updateIdentity('constraints', e.target.value)}
                    placeholder="What will you NOT do?"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 font-bold text-sm focus:border-neo-cyan outline-none transition-colors min-h-[80px]"
                  />
               </div>
               <div className="bg-neo-pink/10 border border-neo-pink/30 p-4 flex gap-4 items-start">
                  <Zap size={16} className="text-neo-pink shrink-0 mt-1" />
                  <p className="font-mono text-[10px] font-bold leading-relaxed opacity-80 uppercase">
                    INKLO: "Your identity core is now synchronized with my reasoning engine. Every move we make will be grounded in these specific parameters to ensure maximum founder-market fit."
                  </p>
               </div>
            </div>
         </section>

         {/* ACCOUNT CONTROL */}
         <section className="bg-neo-pink border-4 border-neo-black p-6 neo-shadow col-span-1 md:col-span-2">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-neo-black pb-2">
               <Shield size={20} />
               PROFILE_IDENTITY_CORE
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-center">
               <div className="flex-1 space-y-2">
                  <div className="font-mono text-[10px] font-bold text-neo-black/60 uppercase">AUTHENTICATED_EMAIL</div>
                  <div className="font-black text-lg bg-white border-2 border-neo-black p-2 neo-shadow transform -rotate-1">
                     {useAppStore.getState().user?.email || 'ANONYMOUS_SESSION'}
                  </div>
                  <div className="pt-4 flex gap-4 text-[10px] font-mono font-black uppercase">
                     <button 
                        onClick={handleUpdateEmail}
                        className="underline hover:text-neo-cyan transition-colors"
                     >
                        UPDATE_EMAIL
                     </button>
                     <button 
                        onClick={handleResetPassword}
                        className="underline hover:text-neo-cyan transition-colors"
                     >
                        RESET_PASSWORD
                     </button>
                     <button 
                        onClick={handleDeleteAccount}
                        className="underline text-red-500 hover:text-red-700 transition-colors"
                     >
                        DELETE_ACCOUNT
                     </button>
                  </div>
               </div>
               
               <div className="w-full md:w-auto flex flex-col gap-3">
                  <button 
                     onClick={() => auth.signOut()}
                     className="bg-neo-black text-neo-white px-10 py-6 font-black uppercase tracking-widest hover:bg-zinc-800 transition-all neo-shadow-hover flex items-center justify-center gap-3 border-4 border-neo-black"
                  >
                     <LogOut size={24} className="text-neo-pink animate-pulse" />
                     SECURE_SIGN_OUT
                  </button>
                  <p className="font-mono text-[8px] text-center text-zinc-500 uppercase">
                    INKLO_ID: {useAppStore.getState().user?.uid?.substring(0, 12)}...
                  </p>
               </div>
            </div>
         </section>
      </div>
    </div>
  );
};

export default UserSettings;
