import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, getDocs, where, setDoc 
} from "firebase/firestore";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken 
} from "firebase/auth";
import { 
  Gavel, LogOut, ShieldAlert, ChevronRight, BarChart3, TrendingUp, User as UserIcon
} from 'lucide-react';

// --- INITIALIZATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'finch-proxy-v1';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [votes, setVotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  
  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('signup'); 
  const [usernameInput, setUsernameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin State
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  // 1. Mandatory Auth First (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching (Guarded by User State)
  useEffect(() => {
    if (!user) return;

    // Public Collections
    const vUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'votes'), 
      (s) => setVotes(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Votes stream error:", err)
    );

    const uUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'users'), 
      (s) => setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Users stream error:", err)
    );

    // Private/Profile Data
    const pUnsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'users', user.uid), 
      (snap) => setProfile(snap.exists() ? snap.data() : null),
      (err) => console.error("Profile stream error:", err)
    );

    const predUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), 
      (s) => setPredictions(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Predictions stream error:", err)
    );

    return () => {
      vUnsub();
      uUnsub();
      pUnsub();
      predUnsub();
    };
  }, [user]);

  // --- ACTIONS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!user) return;
    setAuthError('');
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'users');
      // Simple check for username uniqueness
      const existingDocs = await getDocs(usersRef);
      const isTaken = existingDocs.docs.some(d => d.data().username?.toLowerCase() === usernameInput.toLowerCase());
      
      if (isTaken) {
        setAuthError('Username is already registered in the ledger.');
        return;
      }

      await setDoc(doc(db, 'artifacts', appId, 'public', 'users', user.uid), {
        username: usernameInput,
        brierScore: 0.2500,
        totalVotes: 0,
        uid: user.uid,
        joinedAt: new Date().toISOString()
      });

      setShowAuthModal(false);
      setUsernameInput('');
    } catch (err) {
      setAuthError('Permission denied. Ensure database rules are synced.');
    }
  };

  const submitAnalysis = async (e) => {
    e.preventDefault();
    if (!profile) { 
      setAuthType('signup'); 
      setShowAuthModal(true); 
      return; 
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), {
        voteId: selectedVote.id,
        company: selectedVote.company,
        proposal: selectedVote.proposal,
        forecast: Number(forecast),
        rationale,
        createdAt: new Date().toISOString()
      });
      setView('vault');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const launchMarket = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), {
        ...newVote,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setNewVote({ company: '', proposal: '', description: '' });
      setView('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* HEADER */}
      <nav className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-blue-600 p-1.5 rounded text-white"><Gavel size={18} /></div>
            <span className="font-black text-lg tracking-tighter uppercase">Finch</span>
          </div>
          <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-blue-600' : ''}>Markets</button>
            <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? 'text-blue-600' : ''}>Alpha</button>
            {profile && <button onClick={() => setView('vault')} className={view === 'vault' ? 'text-blue-600' : ''}>Vault</button>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!profile ? (
            <button 
              onClick={() => { setAuthType('signup'); setShowAuthModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700"
            >
              Identify
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{profile.username}</p>
                <p className="text-xs font-black text-blue-600">{profile.brierScore.toFixed(4)}</p>
              </div>
              <button onClick={() => setView('admin')} className="text-slate-300 hover:text-slate-600 transition-colors"><ShieldAlert size={18} /></button>
            </div>
          )}
        </div>
      </nav>

      {/* MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Registry</h2>
            <p className="text-slate-400 text-sm mb-6">Choose an analyst pseudonym to continue.</p>
            <form onSubmit={handleAuth} className="space-y-4">
              <input 
                className="w-full bg-slate-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                placeholder="Pseudonym..."
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                autoFocus
              />
              {authError && <p className="text-red-500 text-[10px] font-bold uppercase">{authError}</p>}
              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all">
                Confirm Identity
              </button>
              <button type="button" onClick={() => setShowAuthModal(false)} className="w-full text-slate-400 text-[10px] font-bold uppercase mt-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-black tracking-tight">Active Ballots</h1>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                <TrendingUp size={12} /> Live Market
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {votes.filter(v => v.status === 'active').map(v => (
                <div 
                  key={v.id} 
                  onClick={() => { setSelectedVote(v); setView('submit'); }}
                  className="bg-white border p-8 rounded-3xl hover:border-blue-600 hover:shadow-xl cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black group-hover:text-blue-600">{v.company}</h3>
                    <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-600" />
                  </div>
                  <div className="inline-block bg-slate-100 text-slate-500 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest mb-4">
                    {v.proposal}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
            {votes.filter(v => v.status === 'active').length === 0 && (
              <div className="py-20 text-center border-2 border-dashed rounded-3xl text-slate-300 font-bold uppercase tracking-widest">
                No active markets found
              </div>
            )}
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-black mb-2">{selectedVote.company}</h1>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">{selectedVote.proposal}</p>
            </div>
            
            <div className="bg-white border p-10 rounded-[2.5rem] shadow-sm">
              <div className="text-center mb-10">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Probability of Passage</p>
                <p className="text-8xl font-black text-slate-900 tabular-nums">{forecast}%</p>
                <input 
                  type="range" 
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600 mt-8 cursor-pointer"
                  value={forecast}
                  onChange={e => setForecast(e.target.value)}
                />
              </div>
              <textarea 
                className="w-full bg-slate-50 p-6 rounded-2xl h-32 outline-none focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all font-medium text-sm"
                placeholder="Rationale / Thesis..."
                value={rationale}
                onChange={e => setRationale(e.target.value)}
              />
              <button 
                onClick={submitAnalysis}
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold mt-8 hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : 'File Analysis'}
              </button>
              <button onClick={() => setView('dashboard')} className="w-full text-slate-400 text-[10px] font-bold uppercase mt-6">Back to Markets</button>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-4xl font-black tracking-tight mb-8">Alpha Leaderboard</h1>
            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
              {allUsers.sort((a,b) => a.brierScore - b.brierScore).map((u, i) => (
                <div key={u.uid} className="flex items-center justify-between p-6 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-200 italic">#{(i+1)}</span>
                    <span className="font-bold">{u.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600">{u.brierScore.toFixed(4)}</p>
                    <p className="text-[9px] font-bold uppercase text-slate-300">Brier</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-xl mx-auto bg-white border p-10 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-black mb-8">System Terminal</h2>
            <form onSubmit={launchMarket} className="space-y-4">
              <input 
                className="w-full border-2 p-4 rounded-xl font-bold outline-none focus:border-blue-600" 
                placeholder="Company Name" 
                value={newVote.company} 
                onChange={e => setNewVote({...newVote, company: e.target.value})} 
                required
              />
              <input 
                className="w-full border-2 p-4 rounded-xl font-bold outline-none focus:border-blue-600" 
                placeholder="Proposal (e.g. Say-on-Pay)" 
                value={newVote.proposal} 
                onChange={e => setNewVote({...newVote, proposal: e.target.value})} 
                required
              />
              <textarea 
                className="w-full border-2 p-4 rounded-xl font-medium outline-none focus:border-blue-600 h-32" 
                placeholder="Description of the proxy event..." 
                value={newVote.description} 
                onChange={e => setNewVote({...newVote, description: e.target.value})} 
                required
              />
              <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700">Open Market</button>
            </form>
          </div>
        )}

        {view === 'vault' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-4xl font-black tracking-tight mb-8">Your Vault</h1>
            {predictions.map(p => (
              <div key={p.id} className="bg-white border p-8 rounded-3xl flex justify-between items-center">
                <div>
                  <p className="font-black text-xl">{p.company}</p>
                  <p className="text-[10px] font-bold uppercase text-blue-600 tracking-widest">{p.proposal}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">{p.forecast}%</p>
                  <p className="text-[9px] font-bold uppercase text-slate-300 italic">Confidence</p>
                </div>
              </div>
            ))}
            {predictions.length === 0 && <p className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest italic">No records in vault</p>}
          </div>
        )}
      </main>
    </div>
  );
}