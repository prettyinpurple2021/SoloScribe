import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

const PrivacyPolicy = ({ onBack }: LegalPageProps) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 font-black uppercase text-sm hover:text-neo-pink transition-colors"
      >
        <ArrowLeft size={16} />
        BACK_TO_CORE
      </button>

      <div className="bg-white border-4 border-neo-black p-10 neo-shadow-lg transform rotate-1">
        <div className="flex items-center gap-4 mb-8 border-b-4 border-neo-black pb-4">
          <ShieldCheck className="text-neo-pink" size={40} />
          <h1 className="text-5xl font-black tracking-tighter uppercase">Privacy Policy</h1>
        </div>

        <div className="space-y-6 font-bold text-zinc-800 leading-relaxed">
          <section>
            <h2 className="text-xl font-black border-b-2 border-neo-black pb-1 mb-2 italic">DATA_COLLECTION_PROTOCOLS</h2>
            <p>SoloScribe collects minimal PII to facilitate founder authentication. This includes email and basic profile data via Google Auth or manual sign-up.</p>
          </section>

          <section>
            <h2 className="text-xl font-black border-b-2 border-neo-black pb-1 mb-2 italic">ENCRYPTION_BY_DEFAULT</h2>
            <p>Your strategy data is stored securely using Firebase protocols. We employ industry-standard encryption for all data at rest and in transit.</p>
          </section>

          <section>
            <h2 className="text-xl font-black border-b-2 border-neo-black pb-1 mb-2 italic">YOUR_SOVEREIGNTY</h2>
            <p>You have the right to purge all data associated with your founder ID at any time via the System Settings menu. We do not sell your strategic feed to third parties.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
