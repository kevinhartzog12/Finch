import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  setDoc,
  getDocs
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  Gavel, 
  ShieldAlert, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  Wallet, 
  CheckCircle2, 
  BarChart3,
  UserCircle,
  Layout,
  User,
  AlertCircle
} from 'lucide-react';

// --- STANDARD FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "", // Environment provides this at runtime
  authDomain: "proxy-intel-platform.firebaseapp.com",
  projectId: "proxy-intel-platform",
  storageBucket: "proxy-intel-platform.appspot.com",
  messagingSenderId: "1092837465",
  appId: "1:1092837465:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'finch-proxy-v1';

export default function App() {
  // Navigation & UI State
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // User State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  
  // Data State
  const [votes, setVotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  
  // Interaction State
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");

  // Admin state
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  // 1. Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Subscriptions (Firestore RULE 1 & 3 applied)
  useEffect(() => {
    if (!user) return;

    // Public Votes: /artifacts/{appId}/public/data/votes
    const vUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'votes'), 
      (snap) => setVotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Votes listener failed:", err)
    );

    // Leaderboard Users: /artifacts/{appId}/public/data/users
    const uUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'users'), 
      (snap) => setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Users listener failed:", err)
    );

    // Current User Profile: /artifacts/{appId}/public/data/users/{uid}
    const pUnsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), 
      (snap) => { if (snap.exists()) setProfile(snap.data()); },
      (err) => console.error("Profile listener failed:", err)
    );

    // Private User Predictions: /artifacts/{appId}/users/{uid}/predictions
    const predUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), 
      (snap) => setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Predictions listener failed:", err)
    );

    return () => { vUnsub(); uUnsub(); pUnsub(); predUnsub(); };
  }, [user]);

  // Handlers
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user || !usernameInput.trim()) return;
    // Use the public data path for user discovery/leaderboard
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
      username: usernameInput,
      brierScore: 0.2500,
      totalVotes: 0,
      uid: user.uid,
      joinedAt: new Date().toISOString()
    });
    setShowAuthModal(false);
  };

  const submitPrediction = async () => {
    if (!profile) { setShowAuthModal(true); return; }
    // Save to private user storage
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), {
      voteId: selectedVote.id,
      company: selectedVote.company,
      proposal: selectedVote.proposal,
      forecast: Number(forecast),
      rationale,
      createdAt: new Date().toISOString()
    });
    setView('dashboard');
  };

  const deployNewMarket = async () => {
    if (!newVote.company || !newVote.proposal) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), { 
      ...newVote, 
      status: 'active',
      createdAt: new Date().toISOString()
    });
    setNewVote({ company: '', proposal: '', description: '' });
    setView('dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-mono text-blue-500 p-4 text-center">
      <div className="animate-pulse tracking-tighter">
        INITIALIZING FINCH PROTOCOL...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Gavel className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight uppercase italic">Finch</span>
          </div>
          <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-blue-600' : 'hover:text-slate-600'}>Markets</button>
            <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? 'text-blue-600' : 'hover:text-slate-600'}>Leaderboard</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!profile ? (
            <button onClick={() => setShowAuthModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:bg-blue-700 active:scale-95 transition-all">Connect</button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Analyst</p>
                <p className="text-sm font-black text-slate-800">{profile.username}</p>
              </div>
              <button onClick={() => setView('admin')} className="text-slate-300 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full">
                <ShieldAlert size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {view === 'dashboard' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Open Markets</h1>
              <p className="text-slate-500 font-medium">Verify signals for controversial shareholder votes.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {votes.map(v => (
                <div key={v.id} onClick={() => { setSelectedVote(v); setView('submit'); }} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl cursor-pointer transition-all flex flex-col group">
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{v.company}</h3>
                  <span className="inline-block text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase mb-4 self-start">{v.proposal}</span>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-grow">{v.description || "In-depth proxy analysis pending."}</p>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center group-hover:border-blue-100 transition-colors text-[10px] font-bold uppercase text-slate-400">
                    <span>Active Signal</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-2xl mx-auto py-4">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-blue-600 mb-6">
              <ChevronRight size={14} className="rotate-180" /> Back
            </button>
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              <h2 className="text-4xl font-black mb-1 text-slate-900 tracking-tighter">{selectedVote.company}</h2>
              <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-10">{selectedVote.proposal}</p>
              
              <div className="text-center mb-10 bg-slate-50 py-10 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Probability Forecast</p>
                <span className="text-8xl font-black text-slate-900 tabular-nums">{forecast}%</span>
                <input type="range" className="w-full max-w-sm mt-8 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" value={forecast} onChange={e => setForecast(e.target.value)} />
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Research Insight</label>
                <textarea className="w-full bg-slate-50 p-6 rounded-2xl h-40 border border-slate-100 focus:border-blue-500 outline-none transition-all resize-none font-medium" placeholder="What is the market missing?" value={rationale} onChange={e => setRationale(e.target.value)} />
              </div>

              <button onClick={submitPrediction} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">File Analysis</button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-xl mx-auto py-4">
            <h2 className="text-2xl font-black mb-6">Deploy New Market</h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-4">
              <input className="w-full border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-blue-600" placeholder="Company Name" value={newVote.company} onChange={e => setNewVote({...newVote, company: e.target.value})} />
              <input className="w-full border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-blue-600" placeholder="Proposal Title" value={newVote.proposal} onChange={e => setNewVote({...newVote, proposal: e.target.value})} />
              <textarea className="w-full border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-blue-600 h-32" placeholder="Description" value={newVote.description} onChange={e => setNewVote({...newVote, description: e.target.value})} />
              <button onClick={deployNewMarket} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest">Deploy to Ledger</button>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Award className="text-amber-500" /> Top Analysts
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
              {allUsers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium">No analysts indexed yet.</div>
              ) : (
                allUsers.sort((a,b) => a.brierScore - b.brierScore).map((u, i) => (
                  <div key={u.uid} className="flex items-center justify-between p-6 border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-300 w-6">#{i+1}</span>
                      <span className="font-bold text-slate-800">{u.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-600 font-mono font-black">{u.brierScore.toFixed(4)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Brier Score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-10 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="font-black text-3xl mb-2 text-center tracking-tighter italic">Establish Identity</h2>
            <p className="text-slate-500 text-center text-sm mb-6">Analyst pseudonym is required for the public leaderboard.</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <input className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-lg text-center" placeholder="ANALYST_NAME" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Join Protocol</button>
              <button type="button" onClick={() => setShowAuthModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest py-2">Anonymous Guest</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}