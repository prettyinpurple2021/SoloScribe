import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, 
  Share2, 
  Send, 
  MessageSquare, 
  Zap, 
  Plus, 
  Trash2, 
  Flame, 
  Clock, 
  Globe, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/state';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PostRecord {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  title: string;
  content: string;
  founderMood: string;
  likesCount: number;
  createdAt: any;
}

interface CommentRecord {
  id: string;
  userId: string;
  userDisplayName: string;
  content: string;
  createdAt: any;
}

const CommunityTab = () => {
  const { user, setCurrentDocument, setFounderMood, setActiveTab } = useAppStore();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'mine'>('all');
  
  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('HYPER-FOCUSED');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Expanded Posts for Comments & Likes tracking
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: CommentRecord[] }>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [userLikesMap, setUserLikesMap] = useState<{ [postId: string]: boolean }>({});

  // Real-time synchronization of public posts feed
  useEffect(() => {
    if (!auth.currentUser) return;

    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostRecord[];
      
      setPosts(data);
      setLoading(false);

      // Fetch user's individual upvote status for these documents
      if (auth.currentUser) {
        const likesTemp: { [postId: string]: boolean } = {};
        for (const post of data) {
          try {
            const likeDocRef = doc(db, 'posts', post.id, 'likes', auth.currentUser.uid);
            const likeSnap = await getDoc(likeDocRef);
            if (likeSnap.exists()) {
              likesTemp[post.id] = true;
            }
          } catch (e) {
            console.warn('Failed tracking like state for post', post.id, e);
          }
        }
        setUserLikesMap(likesTemp);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  // Real-time synchronization of comment logs for the currently expanded post
  useEffect(() => {
    if (!expandedCommentsPostId) return;

    const commentsQuery = query(
      collection(db, 'posts', expandedCommentsPostId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentRecord[];
      
      setCommentsMap(prev => ({
        ...prev,
        [expandedCommentsPostId]: list
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${expandedCommentsPostId}/comments`);
    });

    return () => unsubscribe();
  }, [expandedCommentsPostId]);

  // Submit manual build-in-public post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error('AUTH_REQUIRED', { description: 'Please authenticate before posting.' });
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('EMPTY_FIELDS', { description: 'All broadcast topics and content specs must be defined.' });
      return;
    }

    setIsBroadcasting(true);
    const toastId = toast.loading('BROADCASTING_BUILD_IN_PUBLIC_INTEL...');

    try {
      const customPost = {
        userId: auth.currentUser.uid,
        userDisplayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous Founder',
        userEmail: auth.currentUser.email || 'unknown',
        title: newTitle.trim(),
        content: newContent.trim(),
        founderMood: newMood,
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts'), customPost);
      
      toast.success('BROADCAST_PUBLISHED_SUCCESSFULLY', { id: toastId, description: `Shared: "${newTitle}"` });
      setNewTitle('');
      setNewContent('');
      setNewMood('HYPER-FOCUSED');
    } catch (err: any) {
      toast.error('BROADCAST_FAILURE', { id: toastId, description: err.message });
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Toggle upvote safely with atomic transactions (zero update leaks)
  const handleToggleLike = async (postId: string) => {
    if (!auth.currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, 'posts', postId, 'likes', auth.currentUser.uid);
    const alreadyLiked = !!userLikesMap[postId];

    try {
      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
          throw new Error('Post does not exist');
        }

        const currentLikes = postSnap.data()?.likesCount || 0;
        const newLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        transaction.update(postRef, { likesCount: newLikes });
        if (alreadyLiked) {
          transaction.delete(likeRef);
        } else {
          transaction.set(likeRef, { likedAt: serverTimestamp() });
        }
      });

      setUserLikesMap(prev => ({
        ...prev,
        [postId]: !alreadyLiked
      }));
      toast.success(alreadyLiked ? 'BROADCAST_UNVOTED' : 'BROADCAST_UPVOTED');
    } catch (err: any) {
      toast.error('UPVOTE_FAILED');
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  // Create a collaborative feedback reply/peer-audit
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!newCommentText.trim()) return;

    try {
      const payload = {
        userId: auth.currentUser.uid,
        userDisplayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous Founder',
        content: newCommentText.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts', postId, 'comments'), payload);
      setNewCommentText('');
      toast.success('PEER_AUDIT_ADDED');
    } catch (err: any) {
      toast.error('COMMENT_SUBMISSION_FAILED');
      handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments`);
    }
  };

  // Delete matching owned posts
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('PURGE_THIS_PUBLIC_BROADCAST? This action is real and permanent.')) return;
    
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('BROADCAST_PURGED');
    } catch (err: any) {
      toast.error('PURGE_FAILED');
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  // load remote strategy to co-pilot space immediately
  const handleLoadToEditor = (post: PostRecord) => {
    setCurrentDocument(post.content);
    setFounderMood(post.founderMood);
    setActiveTab('keynote');
    toast.success('PULLED_TO_ACTIVE_CO_PILOT', {
      description: `Loaded: "${post.title}" shared by ${post.userDisplayName}`
    });
  };

  const filteredPosts = activeSubTab === 'mine' && auth.currentUser
    ? posts.filter(p => p.userId === auth.currentUser?.uid)
    : posts;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8">
      {/* SHARER FORM AT SIDEBAR */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-neo-lime text-neo-black p-6 border-4 border-neo-black neo-shadow-lg transform -rotate-1">
          <div className="flex items-center gap-3">
            <Globe className="text-neo-black animate-spin" style={{ animationDuration: '6s' }} />
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Community<br/>Hub</h2>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wide mt-2 font-bold opacity-80 leading-tight">
            An encrypted network to share strategic milestones, ask for advice, and review live templates transparently.
          </p>
        </div>

        {/* FEED FILTERS */}
        <div className="grid grid-cols-2 border-4 border-neo-black p-1 bg-white">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`py-3 font-black text-xs uppercase tracking-wider transition-all ${activeSubTab === 'all' ? 'bg-neo-black text-white' : 'hover:bg-zinc-100 text-neo-black'}`}
          >
            GLOBAL_FEED ({posts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('mine')}
            className={`py-3 font-black text-xs uppercase tracking-wider transition-all ${activeSubTab === 'mine' ? 'bg-neo-black text-white' : 'hover:bg-zinc-100 text-neo-black'}`}
          >
            MY_BROADCASTS
          </button>
        </div>

        {/* BROADCAST CONFLICT FORM */}
        <form onSubmit={handleCreatePost} className="bg-white border-4 border-neo-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="border-b-2 border-neo-black pb-2">
            <h3 className="font-black text-sm uppercase tracking-wider">Broadcaster Engine</h3>
            <p className="text-[10px] text-zinc-500 font-mono">BUILD_IN_PUBLIC // INKLO_NET</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] font-black uppercase text-zinc-500">START_UP_PROJECT_NAME</label>
            <input 
              type="text" 
              placeholder="e.g. Acme MicroSaaS"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border-2 border-neo-black p-2 text-xs uppercase font-bold outline-none bg-zinc-50 focus:bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] font-black uppercase text-zinc-500">Milestones / Thought-dump</label>
            <textarea 
              placeholder="Dump your business model, pitch strategies, or marketing headlines here. Be real and transparent."
              rows={5}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="border-2 border-neo-black p-3 text-xs font-bold outline-none bg-zinc-50 focus:bg-white resize-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] font-black uppercase text-zinc-500">CURRENT_FOUNDER_MOOD</label>
            <select 
              value={newMood} 
              onChange={(e) => setNewMood(e.target.value)}
              className="border-2 border-neo-black p-2 text-xs font-black uppercase outline-none bg-zinc-50 focus:bg-white"
            >
              <option value="HYPER-FOCUSED">HYPER-FOCUSED</option>
              <option value="NERVOUS_BUT_EXCITED">NERVOUS_BUT_EXCITED</option>
              <option value="CRUSHING_IT">CRUSHING_IT</option>
              <option value="RUNNING_ON_CAFFEINE">RUNNING_ON_CAFFEINE</option>
              <option value="PIVOT_MODE">PIVOT_MODE</option>
              <option value="SLEEP_DEPRIVED">SLEEP_DEPRIVED</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isBroadcasting}
            className="bg-neo-pink text-neo-black font-black uppercase text-xs py-3 border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isBroadcasting ? 'BROADCASTING...' : 'BROADCAST ON INKLO_NET'}
          </button>
        </form>
      </div>

      {/* TIMELINE LIST */}
      <div className="flex-1 min-h-[600px] flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white/40 border-4 border-neo-black animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-neo-black/15 bg-neo-black/5 p-20 text-center flex-1">
            <Users size={64} className="text-neo-black/10 mb-6" />
            <h3 className="text-2xl font-black uppercase opacity-30">NO_COMMUNITY_POSTS_FOUND</h3>
            <p className="max-w-md font-bold text-xs opacity-30 mt-2 uppercase">Be the very first lone wolf to launch a thought-dump milestone or request reviews on Inklo_Net!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredPosts.map((post) => {
                const isLiked = !!userLikesMap[post.id];
                const isExpanded = expandedCommentsPostId === post.id;
                const postComments = commentsMap[post.id] || [];

                return (
                  <motion.div 
                    key={post.id}
                    layout="position"
                    className="bg-white border-4 border-neo-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative transition-all"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3 border-b-2 border-neo-black pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neo-cyan border-2 border-neo-black flex items-center justify-center font-black text-sm uppercase text-neo-black">
                          {post.userDisplayName?.[0]}
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                            {post.userDisplayName}
                            <span className="font-mono text-[8px] font-black bg-neo-black text-white px-1">
                              MOOD: {post.founderMood}
                            </span>
                          </div>
                          <div className="font-mono text-[8px] text-zinc-500 uppercase flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {post.createdAt?.toDate().toLocaleString() || 'RECENT BROADCAST'}
                          </div>
                        </div>
                      </div>

                      {auth.currentUser?.uid === post.userId && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="hover:text-neo-pink text-zinc-400 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-lg uppercase mb-3 text-neo-black">{post.title}</h3>

                    {/* Body */}
                    <p className="font-bold text-sm text-zinc-700 leading-relaxed bg-zinc-55 p-3 rounded-md line-clamp-10 mb-5 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Interaction toolbar */}
                    <div className="flex flex-wrap items-center justify-between border-t border-zinc-200 pt-3 gap-3">
                      <div className="flex gap-4">
                        {/* Vote Button */}
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`
                            px-4 py-1.5 border-2 border-neo-black font-black text-xs uppercase flex items-center gap-2 transition-all
                            ${isLiked ? 'bg-neo-yellow text-neo-black shadow-none translate-x-0.5' : 'bg-white hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                          `}
                        >
                          <Flame className={`w-4 h-4 ${isLiked ? 'fill-neo-black' : ''}`} />
                          UPVOTE ({post.likesCount})
                        </button>

                        {/* Comments Toggle Button */}
                        <button 
                          onClick={() => setExpandedCommentsPostId(isExpanded ? null : post.id)}
                          className={`
                            px-4 py-1.5 border-2 border-neo-black font-black text-xs uppercase flex items-center gap-2 transition-all
                            ${isExpanded ? 'bg-neo-black text-white' : 'bg-white hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                          `}
                        >
                          <MessageSquare className="w-4 h-4" />
                          PEER_REVIEWS ({postComments.length || 0})
                        </button>
                      </div>

                      {/* Pull strategy to editor button */}
                      <button 
                        onClick={() => handleLoadToEditor(post)}
                        className="bg-neo-cyan hover:bg-neo-black hover:text-white transition-all text-neo-black font-black uppercase text-xs px-4 py-2 border-2 border-neo-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        LOAD_IN_WRITER
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Comments block slider */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden bg-zinc-50 border-t-2 border-neo-black mt-4 -mx-6 -mb-6 p-6 space-y-4"
                        >
                          <h4 className="font-black text-xs uppercase text-neo-pink border-b border-zinc-200 pb-1">
                            FOUNDER_REVIEWS_LOG //
                          </h4>

                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {postComments.length === 0 ? (
                              <div className="p-4 border-2 border-dashed border-neo-black/15 text-center font-mono text-[10px] uppercase opacity-40">
                                NO_REVIEWS_BROADCAST_YET
                              </div>
                            ) : (
                              postComments.map((com) => (
                                <div key={com.id} className="p-3 bg-white border-2 border-neo-black shadow-sm text-xs">
                                  <div className="flex justify-between items-center mb-1 font-black text-[10px]">
                                    <span className="text-neo-cyan bg-neo-black px-1 leading-tight">{com.userDisplayName}</span>
                                    <span className="font-mono text-[8px] text-zinc-400">
                                      {com.createdAt?.toDate().toLocaleDateString() || 'JUST NOW'}
                                    </span>
                                  </div>
                                  <p className="font-bold text-zinc-700 leading-tight whitespace-pre-wrap">{com.content}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Post comment input box */}
                          <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Submit strategy feedback, audit, or collaboration inquiries..."
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              className="flex-1 bg-white border-2 border-neo-black p-2 text-xs font-bold outline-none"
                              required
                            />
                            <button 
                              type="submit" 
                              className="bg-neo-black text-white border-2 border-neo-black font-black px-4 uppercase text-xs text-center flex items-center justify-center hover:bg-neo-pink hover:text-neo-black transition-colors"
                            >
                              <Send size={14} />
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityTab;
