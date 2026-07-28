import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { Sparkles, Brain, Settings, Rocket, Zap, Heart, Disc, LogOut, Eye, Book, Users, Edit3 } from 'lucide-react';
import { useAppStore } from './lib/state';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthPage from './components/auth/AuthPage';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import FeatureTour from './components/FeatureTour';
import TermsOfService from './components/Legal/TermsOfService';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import InkloChatbot from './components/InkloChatbot';
import Scratchpad from './components/Scratchpad';

const KeynoteCompanion = React.lazy(() => import('./components/workspace/KeynoteCompanion'));
const WelcomeScreen = React.lazy(() => import('./components/WelcomeScreen'));
const UserSettings = React.lazy(() => import('./components/UserSettings'));
const MarketingTab = React.lazy(() => import('./components/workspace/MarketingTab'));
const ComplianceTab = React.lazy(() => import('./components/workspace/ComplianceTab'));
const MonetizationTab = React.lazy(() => import('./components/workspace/MonetizationTab'));
const AIAuditorTab = React.lazy(() => import('./components/workspace/AIAuditorTab'));
const RoadmapTab = React.lazy(() => import('./components/workspace/RoadmapTab'));
const StrategyVaultTab = React.lazy(() => import('./components/workspace/StrategyVaultTab'));
const CommunityTab = React.lazy(() => import('./components/workspace/CommunityTab'));

const FallbackLoader = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center gap-4 border-4 border-neo-black bg-neo-white neo-shadow-lg p-8">
    <div className="w-8 h-8 border-4 border-neo-black border-t-neo-cyan animate-spin rounded-full" />
    <div className="font-black uppercase tracking-widest text-xs">Loading Module...</div>
  </div>
);

function App() {
  const [view, setView] = useState<'home' | 'auth' | 'terms' | 'privacy'>('home');
  const [showTour, setShowTour] = useState(false);
  const { user, setUser, founderMood, hasSeenTutorial, setHasSeenTutorial, activeTab, setActiveTab, isScratchpadOpen, setIsScratchpadOpen } = useAppStore();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setView('home');

        // Fetch additional profile data
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.founderIdentity) {
              useAppStore.getState().setFounderIdentity(data.founderIdentity);
            }
          }
        } catch (error) {
          console.error("Critical Profile Sync Failure:", error);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleSignOut = () => {
    signOut(auth);
  };

  if (!user) {
    return (
      <div className="min-h-screen overflow-x-hidden font-sans relative">
        <div className="y2k-grid fixed inset-0 z-0 pointer-events-none" />
        <Toaster position="top-right" expand={false} richColors />
        
        <header className="fixed top-0 left-0 right-0 h-20 bg-neo-black text-white z-40 flex items-center justify-between px-6 border-b-4 border-neo-black">
          <div className="flex items-center gap-4 bg-neo-cyan text-neo-black px-4 py-2 neo-border neo-shadow transform -rotate-1 cursor-pointer" onClick={() => setView('home')}>
            <Rocket className="w-6 h-6" />
            <span className="font-extrabold text-2xl tracking-tighter">SOLOSCRIBE</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('auth')}
              className="bg-neo-pink text-neo-black px-6 py-2 border-4 border-neo-black font-black neo-shadow-hover transition-all transform active:scale-95"
            >
              INITIALIZE_CORE
            </button>
          </div>
        </header>

        <main className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {view === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AuthPage />
              </motion.div>
            )}
            {view === 'home' && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LandingPage onStart={() => setView('auth')} />
              </motion.div>
            )}
            {view === 'terms' && (
              <motion.div key="terms" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <TermsOfService onBack={() => setView('home')} />
              </motion.div>
            )}
            {view === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                <PrivacyPolicy onBack={() => setView('home')} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 h-12 bg-neo-black border-t-4 border-neo-black flex items-center px-6 text-[10px] font-mono text-neo-white justify-between z-40">
          <div className="flex gap-6">
            <button onClick={() => setView('terms')} className="hover:text-neo-cyan transition-colors underline uppercase">TERMS_OF_SERVICE</button>
            <button onClick={() => setView('privacy')} className="hover:text-neo-pink transition-colors underline uppercase">PRIVACY_POLICY</button>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-neo-yellow" />
            <span>SOLOSCRIBE_V5 // PUBLIC_GATEWAY</span>
          </div>
        </footer>

        <InkloChatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden font-sans relative">
      <div className="y2k-grid fixed inset-0 z-0 pointer-events-none" />
      <Toaster position="top-right" expand={false} richColors />

      <AnimatePresence>
        {!hasSeenTutorial && (
          <Onboarding onComplete={(startTour) => {
            setHasSeenTutorial(true);
            if (startTour) setShowTour(true);
          }} />
        )}
        {showTour && (
          <FeatureTour onComplete={() => setShowTour(false)} />
        )}
      </AnimatePresence>

      <InkloChatbot />
      <Scratchpad />

      {/* HEADER / NAV - NEO-BRUTALIST */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-neo-black text-white z-40 flex items-center justify-between px-6 border-b-4 border-neo-black">
        <div className="flex items-center gap-4 bg-neo-cyan text-neo-black px-4 py-2 neo-border neo-shadow transform -rotate-1">
          <Rocket className="w-6 h-6 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tighter">SOLOSCRIBE</span>
        </div>

        <nav className="hidden md:flex gap-4">
          {[
            { id: 'strategy', label: 'STRATEGY', icon: Brain, color: 'bg-neo-yellow', tour: 'nav-strategy' },
            { id: 'keynote', label: 'KEYNOTE', icon: Sparkles, color: 'bg-neo-cyan', tour: 'nav-keynote' },
            { id: 'vault', label: 'VAULT', icon: Book, color: 'bg-neo-lime', tour: 'nav-vault' },
            { id: 'community', label: 'COMMUNITY', icon: Users, color: 'bg-neo-pink', tour: 'nav-community' },
            { id: 'marketing', label: 'MARKETING', icon: Rocket, color: 'bg-neo-pink', tour: 'nav-marketing' },
            {id: 'compliance', label: 'COMPLIANCE', icon: Disc, color: 'bg-neo-lime', tour: 'nav-compliance' },
            { id: 'monetization', label: 'REVENUE', icon: Zap, color: 'bg-neo-yellow', tour: 'nav-revenue' },
            { id: 'audit', label: 'AUDIT', icon: Eye, color: 'bg-neo-cyan', tour: 'nav-audit' },
            { id: 'roadmap', label: 'ROADMAP', icon: Disc, color: 'bg-neo-pink', tour: 'nav-roadmap' },
            { id: 'settings', label: 'SYSTEM', icon: Settings, color: 'bg-white', tour: 'nav-settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              data-tour={tab.tour}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-2 border-4 border-neo-black font-black text-sm uppercase tracking-widest transition-all
                ${activeTab === tab.id 
                  ? `${tab.color} text-neo-black transform -translate-y-1 -translate-x-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` 
                  : 'bg-white text-neo-black hover:bg-zinc-100'}
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
            className="flex items-center gap-2 px-3 py-1 bg-neo-yellow border-2 border-neo-black neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-neo-black"
            title="Toggle Idea Scratchpad"
          >
            <Edit3 size={16} />
            <span className="font-black text-xs uppercase hidden lg:inline">SCRATCHPAD</span>
          </button>
          {user && (
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-neo-black neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-neo-pink border-2 border-neo-black flex items-center justify-center font-black text-xs text-white">
                {user.displayName?.[0] || 'F'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-neo-black font-black text-[10px] leading-none uppercase">{user.displayName || 'FOUNDER'}</div>
                <div className="text-neo-black/40 font-mono text-[8px] uppercase">PROFILE_v5</div>
              </div>
            </button>
          )}
          <div className="bg-neo-yellow text-neo-black px-3 py-1 border-2 border-neo-black font-mono text-xs font-bold uppercase neo-shadow hidden lg:block">
             MOOD: {founderMood}
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 bg-neo-black border-2 border-neo-white text-neo-white hover:bg-neo-pink transition-all transform active:scale-95"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="pt-28 pb-12 px-6 max-w-[1400px] mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' && (
            <motion.div
              key="strategy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <WelcomeScreen />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'keynote' && (
            <motion.div
              key="keynote"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="w-full"
            >
              <Suspense fallback={<FallbackLoader />}>
                <KeynoteCompanion />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <StrategyVaultTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <CommunityTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'marketing' && (
            <motion.div
              key="marketing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <MarketingTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'compliance' && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <ComplianceTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'monetization' && (
            <motion.div
              key="monetization"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <MonetizationTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <AIAuditorTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <RoadmapTab />
              </Suspense>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <Suspense fallback={<FallbackLoader />}>
                <UserSettings />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER STRIP */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-neo-black border-t-4 border-neo-black flex items-center px-6 text-[10px] font-mono text-neo-white justify-between z-40">
        <div className="flex gap-4">
          <span>PROJECT: SOLOSCRIBE_V5</span>
          <span>BUILD: 2026.05.13</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-neo-yellow" />
          <span>CONNECTED TO INKLO_NET</span>
          <Heart size={12} className="text-neo-pink fill-neo-pink" />
        </div>
      </footer>
    </div>
  );
}

export default App;
