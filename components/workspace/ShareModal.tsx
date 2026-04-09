import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Copy, Globe, Lock, Check, MessageSquare, BarChart3, Eye, Clock } from 'lucide-react';
import { useUI, Project } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { Tooltip } from '../Tooltip';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, project }) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (project) {
      setIsPublic(project.isPublic || false);
      setShareId(project.shareId || '');
    }
  }, [project]);

  if (!project || !user) return null;

  const handleToggleShare = async () => {
    setIsSaving(true);
    const newIsPublic = !isPublic;
    const newShareId = shareId || Math.random().toString(36).substring(2, 15);

    try {
      const projectRef = doc(db, 'users', user.uid, 'projects', project.id);
      const publicProjectRef = doc(db, 'public_projects', newShareId);

      if (newIsPublic) {
        // Update user project
        await setDoc(projectRef, {
          isPublic: true,
          shareId: newShareId,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Create public entry
        await setDoc(publicProjectRef, {
          ...project,
          isPublic: true,
          shareId: newShareId,
          updatedAt: serverTimestamp()
        });
      } else {
        // Update user project
        await setDoc(projectRef, {
          isPublic: false,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Note: We might want to delete the public entry or just leave it inaccessible
      }

      setIsPublic(newIsPublic);
      setShareId(newShareId);
      toast.success(newIsPublic ? 'Project shared publicly!' : 'Project is now private.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${project.id}`);
      toast.error('Failed to update sharing settings');
    } finally {
      setIsSaving(false);
    }
  };

  const shareUrl = `${window.location.origin}/share/${shareId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)'
            }}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--theme-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 243, 255, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.1), transparent)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Share2 size={20} color="var(--theme-accent)" />
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Share Project</h2>
              </div>
              <Tooltip content="Close" position="left">
                <button 
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </Tooltip>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '14px', 
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                Share your startup documentation with potential co-founders, investors, or early users to get valuable feedback.
              </p>

              {/* Status Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isPublic ? (
                    <Globe size={20} color="var(--theme-accent)" />
                  ) : (
                    <Lock size={20} color="rgba(255,255,255,0.4)" />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                      {isPublic ? 'Publicly Shared' : 'Private Project'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      {isPublic ? 'Anyone with the link can view' : 'Only you can access this'}
                    </div>
                  </div>
                </div>
                <Tooltip content={isPublic ? "Disable Public Access" : "Enable Public Access"} position="left">
                  <button
                    onClick={handleToggleShare}
                    disabled={isSaving}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: isPublic ? 'rgba(255, 68, 68, 0.2)' : 'var(--theme-accent)',
                      color: isPublic ? '#ff4444' : 'black',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      opacity: isSaving ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSaving ? 'Updating...' : isPublic ? 'Make Private' : 'Share Publicly'}
                  </button>
                </Tooltip>
              </div>

              {/* Analytics Section */}
              {isPublic && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 243, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 243, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <BarChart3 size={16} color="var(--theme-accent)" />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Analytics</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={14} color="rgba(255,255,255,0.4)" />
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--theme-accent)' }}>{project.viewCount || 0}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Views</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="rgba(255,255,255,0.4)" />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {project.lastViewedAt?.toDate ? new Date(project.lastViewedAt.toDate()).toLocaleDateString() : 'Never'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Last Viewed</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Link Display */}
              {isPublic && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    color: 'rgba(255,255,255,0.4)', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Public Link
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0, 243, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--theme-accent)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {shareUrl}
                    </div>
                    <Tooltip content="Copy Share Link" position="top">
                      <button
                        onClick={copyToClipboard}
                        style={{
                          padding: '0 16px',
                          backgroundColor: 'rgba(0, 243, 255, 0.1)',
                          border: '1px solid rgba(0, 243, 255, 0.3)',
                          borderRadius: '8px',
                          color: 'var(--theme-accent)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </Tooltip>
                  </div>

                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(0, 243, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(0, 243, 255, 0.3)',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <MessageSquare size={20} color="var(--theme-accent)" style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                      <strong>Feedback Loop:</strong> Public viewers can leave comments on your document. You'll be notified of new feedback in your workspace.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
