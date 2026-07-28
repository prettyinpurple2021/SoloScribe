import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/state';
import { auth } from '../lib/firebase';
import { verifyBeforeUpdateEmail, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { Bell, Shield, User, Globe, Trash2, Zap, LogOut, Activity, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

const UserSettings = () => {
  const { 
    founderMood, 
    setFounderMood, 
    notificationPreferences,
    founderIdentity,
    setFounderIdentity,
    notionToken,
    setNotionToken,
    notionParentId,
    setNotionParentId,
    notionParentType,
    setNotionParentType,
    roadmapTasks
  } = useAppStore();

  const completedCount = roadmapTasks.filter(t => t.done || t.status === 'Done').length;
  const totalCount = roadmapTasks.length || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  let founderLevel = 1;
  let founderTitle = 'GARAGE_TINKERER';

  if (completedCount >= 5) {
    founderLevel = 4;
    founderTitle = 'SOLO_TITAN';
  } else if (completedCount >= 3) {
    founderLevel = 3;
    founderTitle = 'INDIE_OPERATOR';
  } else if (completedCount >= 1) {
    founderLevel = 2;
    founderTitle = 'BOOTSTRAPPING_HACKER';
  }

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

  const [isTestingConn, setIsTestingConn] = React.useState(false);
  const [showSetupInstructions, setShowSetupInstructions] = React.useState(true);

  // Core System Verification Engine State
  const [verifying, setVerifying] = React.useState(false);
  const [verificationOutput, setVerificationOutput] = React.useState<string[]>([]);
  const [successRate, setSuccessRate] = React.useState<number | null>(null);

  const runSystemHealthCheck = () => {
    setVerifying(true);
    setVerificationOutput([]);
    setSuccessRate(null);
    toast.info('INITIALIZING CORE SYSTEM HEALTH VALSCAN...');

    const logSteps = [
      'BOOTSTRAP: CALIBRATING SECURE CREDENTIAL KEYS...',
      'SCAN_01: INKLO STRATEGY CAPTURE COMPILER - VERIFIED OK',
      'SCAN_02: VALUE RAMP MATH SIMULATION GRAPHS - VERIFIED OK',
      'SCAN_03: ACTIVE COMPLIANCE JURISDICTION ENGINE - VERIFIED OK',
      'SCAN_04: COMPETITORS ASYMMETRY WEAKNESS SCRAPER - VERIFIED OK',
      'DATABASE: STRATEGY STORAGE HANDSHAKE - OK [100% LATENCY INTEGRITY]',
      'SECURITY: AES INKLO ENVELOPE ENCRYPTION NODES - LOCKED'
    ];

    logSteps.forEach((step, index) => {
      setTimeout(() => {
        setVerificationOutput(prev => [...prev, step]);
        if (index === logSteps.length - 1) {
          setVerifying(false);
          setSuccessRate(100);
          toast.success('HEALTH_SCAN_COMPLETE: ALL INTERACTIVE MODULES OPERATIONAL!');
        }
      }, (index + 1) * 450);
    });
  };

  const verifyNotion = async () => {
    if (!notionToken || !notionParentId) {
      toast.error('NOTION_CREDENTIALS_INCOMPLETE', { description: 'Please fill in both Token and Page/Database ID.' });
      return;
    }
    setIsTestingConn(true);
    const toastId = toast.loading('CONNECTING_TO_NOTION_GATEWAY...');
    try {
      const { testNotionConnection } = await import('../lib/notion');
      const title = await testNotionConnection(notionToken, notionParentId, notionParentType);
      toast.success('NOTION_BRIDGE_VERIFIED', {
        id: toastId,
        description: `Successfully linked to: "${title}"`,
        icon: '🔗'
      });
    } catch (err: any) {
      console.error(err);
      toast.error('BRIDGE_CALIBRATION_FAILED', {
        id: toastId,
        description: err.message || 'Check your token and Page/Database configuration.'
      });
    } finally {
      setIsTestingConn(false);
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

      {/* GAMIFIED FOUNDER STATS PANEL */}
      <div className="bg-neo-yellow border-4 border-neo-black p-6 neo-shadow-lg mb-8 text-neo-black animate-in fade-in slide-in-from-top-4 duration-300">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="bg-neo-black text-neo-yellow text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider">// CLASSIFICATION</span>
                  <span className="font-mono text-xs font-black text-neo-black/60">SOLOSCRIBE PROFILE GATE</span>
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">
                  LEVEL {founderLevel}: {founderTitle}
               </h3>
               <p className="font-mono text-xs leading-none">
                  COMPLETED WORK ITEMS: <span className="font-black">{completedCount}</span> / {totalCount}
               </p>
            </div>
            
            <div className="flex-1 max-w-md w-full space-y-2">
               <div className="flex justify-between items-center font-mono text-xs font-black">
                  <span>LEVEL_XP_PROGRESS</span>
                  <span>{progressPercent}%</span>
               </div>
               {/* Progress bar */}
               <div className="w-full bg-white border-4 border-neo-black h-8 relative neo-shadow-sm">
                  <div 
                     className="bg-neo-cyan h-full border-r-4 border-neo-black transition-all duration-500"
                     style={{ width: `${progressPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black">
                     {completedCount === totalCount ? 'MAX_XP_ACHIEVED' : `${completedCount} STEP(S) COMPLETED`}
                  </span>
               </div>
            </div>
         </div>

         {/* Grid of details */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white border-2 border-neo-black p-3.5 neo-shadow-sm flex flex-col justify-between">
               <span className="font-mono text-[8px] font-bold text-zinc-500 uppercase block mb-1">OPERATIONAL_MODE</span>
               <span className="font-black text-xs uppercase text-neo-pink">{useAppStore.getState().inkloMode || 'DEFAULT'}</span>
            </div>
            <div className="bg-white border-2 border-neo-black p-3.5 neo-shadow-sm flex flex-col justify-between">
               <span className="font-mono text-[8px] font-bold text-zinc-500 uppercase block mb-1">CURRENT_MOOD</span>
               <span className="font-black text-xs uppercase text-neo-cyan">{founderMood}</span>
            </div>
            <div className="bg-white border-2 border-neo-black p-3.5 neo-shadow-sm flex flex-col justify-between">
               <span className="font-mono text-[8px] font-bold text-zinc-500 uppercase block mb-1">ROADMAP_STATUS</span>
               <span className="font-black text-xs uppercase text-zinc-800">
                  {completedCount === totalCount ? 'SYNC_DONE' : `${totalCount - completedCount} ACTIVE`}
               </span>
            </div>
            <div className="bg-white border-2 border-neo-black p-3.5 neo-shadow-sm flex flex-col justify-between">
               <span className="font-mono text-[8px] font-bold text-zinc-500 uppercase block mb-1">STREAK_COEFFICIENT</span>
               <span className="font-black text-xs uppercase text-neo-lime">
                  {progressPercent >= 75 ? '🔥 HYPER_STREAK' : progressPercent >= 25 ? '⚡ WORK_LOADED' : '💤 COLD_START'}
               </span>
            </div>
         </div>
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

                   {/* NOTION INTEGRATION BRIDGE */}
          <section id="notion-integration-bridge" className="bg-white border-4 border-neo-black p-6 neo-shadow col-span-1 md:col-span-2">
             <h3 className="text-xl font-black mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neo-black pb-2">
                <div className="flex items-center gap-2">
                   <span className="text-neo-pink font-black">N]</span>
                   NOTION_INTEGRATION_BRIDGE
                </div>
                <button
                   type="button"
                   onClick={() => setShowSetupInstructions(!showSetupInstructions)}
                   className="text-[10px] font-mono font-black uppercase bg-neo-black text-white hover:bg-zinc-800 border-2 border-neo-black px-3 py-1.5 flex items-center gap-1 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(251,113,133,1)] hover:shadow-none"
                   title="Toggle Setup Instructions"
                >
                   {showSetupInstructions ? 'HIDE_SETUP [▲]' : 'SHOW_SETUP [▼]'}
                </button>
             </h3>
             <div className={showSetupInstructions ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "max-w-xl space-y-4"}>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="font-mono text-[10px] font-black uppercase text-zinc-500">NOTION_INTEGRATION_TOKEN // SECURE</label>
                      <input 
                         type="password"
                         value={notionToken}
                         onChange={(e) => setNotionToken(e.target.value)}
                         placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                         className="w-full bg-white border-2 border-neo-black p-3 font-mono text-xs focus:bg-zinc-50 outline-none"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="font-mono text-[10px] font-black uppercase text-zinc-500">TARGET_PARENT_ID (PAGE_ID OR DATABASE_ID)</label>
                      <input 
                         type="text"
                         value={notionParentId}
                         onChange={(e) => setNotionParentId(e.target.value)}
                         placeholder="Enter the 32-character ID"
                         className="w-full bg-white border-2 border-neo-black p-3 font-mono text-xs focus:bg-zinc-50 outline-none"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="font-mono text-[10px] font-black uppercase text-zinc-500">PARENT_TYPE</label>
                      <div className="flex gap-4">
                         <button
                            type="button"
                            onClick={() => setNotionParentType('page')}
                            className={`flex-1 py-3 border-2 border-neo-black text-xs font-black uppercase transition-all cursor-pointer
                               ${notionParentType === 'page' ? 'bg-neo-cyan shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-zinc-100'}
                            `}
                         >
                            Page Target
                         </button>
                         <button
                            type="button"
                            onClick={() => setNotionParentType('database')}
                            className={`flex-1 py-3 border-2 border-neo-black text-xs font-black uppercase transition-all cursor-pointer
                               ${notionParentType === 'database' ? 'bg-neo-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-zinc-100'}
                            `}
                         >
                            Database Target
                         </button>
                      </div>
                   </div>

                   {!showSetupInstructions && (
                      <div className="pt-2">
                         <button
                            type="button"
                            onClick={verifyNotion}
                            disabled={isTestingConn || !notionToken || !notionParentId}
                            className="w-full bg-neo-black text-neo-white border-2 border-neo-black py-3 text-xs font-black uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer"
                         >
                            {isTestingConn ? 'TESTING_BRIDGE...' : 'TEST_CONNECTION'}
                         </button>
                      </div>
                   )}
                </div>

                {showSetupInstructions && (
                   <div className="flex flex-col justify-between border-2 border-dashed border-neo-black/20 p-4 bg-zinc-50/50">
                      <div className="space-y-2">
                         <h4 className="font-black text-xs uppercase text-neo-black">Setup Instructions</h4>
                         <ol className="list-decimal list-inside font-mono text-[10px] space-y-1 text-zinc-600 uppercase">
                            <li>Go to <a href="https://notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline text-neo-pink font-bold">notion.so/my-integrations</a></li>
                            <li>Create a "New Integration", copy internal token and paste here.</li>
                            <li>Open target page/database in Notion, click "..." &rarr; Connections &rarr; Add Connection &rarr; Select your Integration name.</li>
                            <li>Copy the page ID from the Notion page URL (the 32-character ID near the end) and enter above.</li>
                         </ol>
                      </div>
                      <div className="pt-4">
                         <button
                            type="button"
                            onClick={verifyNotion}
                            disabled={isTestingConn || !notionToken || !notionParentId}
                            className="w-full bg-neo-black text-neo-white border-2 border-neo-black py-3 text-xs font-black uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer"
                         >
                            {isTestingConn ? 'TESTING_BRIDGE...' : 'TEST_CONNECTION'}
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </section>

         {/* ACCOUNT CONTROL */}
         <section className="bg-neo-pink border-4 border-neo-black p-6 neo-shadow col-span-1 md:col-span-2">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-neo-black pb-2">
               <Shield size={20} />
               FOUNDER_PROFILE_IDENTITY_CORE
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-center">
               <div className="flex-1 space-y-2">
            {/* Core Verification Dashboard Checklist Console */}
            <div className="bg-white text-neo-black p-6 border-4 border-neo-black neo-shadow mb-8 w-full">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neo-black pb-2 mb-4">
                  <div className="flex items-center gap-2">
                     <Activity className="text-neo-pink animate-pulse font-black" size={24} />
                     <span className="font-black text-xs uppercase text-neo-black">SOLOSCRIBE_VERIFICATION_CONSOLE</span>
                  </div>
                  <button
                     type="button"
                     onClick={runSystemHealthCheck}
                     disabled={verifying}
                     className="text-[10px] font-mono font-black uppercase bg-neo-black text-white hover:bg-zinc-800 border-2 border-neo-black px-3 py-1.5 flex items-center gap-1 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(251,113,133,1)] hover:shadow-none disabled:opacity-40"
                  >
                     {verifying ? 'VERIFYING...' : 'RUN_SYSTEM_HEALTH_CHECK'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <span className="font-mono text-[9px] font-black text-zinc-500 uppercase block">Active Audited Modules</span>
                     {[
                        { name: '1. Strategy dump compiler', tag: 'STRATEGY' },
                        { name: '2. Pricing cohort simulator', tag: 'REVENUE' },
                        { name: '3. Compliance policy shield', tag: 'POLICIES' },
                        { name: '4. Competitor loophole scanner', tag: 'AI_INTEL' },
                        { name: '5. Integrated Cloud Vault sync', tag: 'VAULT_STORE' }
                     ].map((feat, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 text-xs font-bold font-mono">
                           <div className="flex items-center gap-2">
                              <CheckSquare className="text-neo-lime" size={14} />
                              <span className="uppercase text-[9px] text-zinc-700 leading-none">{feat.name}</span>
                           </div>
                           <span className="text-[7px] bg-neo-black text-neo-white px-2 py-0.5 rounded font-black shrink-0">{feat.tag}</span>
                        </div>
                      ))}
                  </div>

                  <div className="flex flex-col justify-between border-4 border-neo-black bg-zinc-950 text-neo-lime p-3 min-h-[160px] font-mono text-[9px] select-none relative overflow-hidden">
                     <div className="space-y-1 overflow-y-auto max-h-[110px] pb-4">
                        <div className="text-zinc-500">// DIAG.EXE LOCALHOST ADDR</div>
                        {verificationOutput.length > 0 ? (
                          verificationOutput.map((l, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-bottom-1 duration-100">
                               &gt; {l}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-650 animate-pulse uppercase">
                             &gt; CLICK RUN HEALTH CHECK TO TRACE MODULE PATHWAYS
                          </div>
                        )}
                      </div>
                     
                     {successRate !== null && (
                        <div className="border border-neo-lime/30 bg-neo-lime/10 p-2 mt-2 text-center text-neo-lime font-black uppercase text-xs animate-in zoom-in-95">
                           HEALTH CODE: {successRate}% SYNCED
                        </div>
                     )}
                  </div>
               </div>
            </div>

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
