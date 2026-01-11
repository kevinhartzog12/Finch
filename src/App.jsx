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
  onAuthStateChanged, 
  signInWithCustomToken 
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
  UserCircle
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'finch-proxy-v1';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [votes, setVotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");

  // Admin state
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  // Auth initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
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

  // Data subscriptions
  useEffect(() => {
    if (!user) return;

    const vUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), (snap) => {
      setVotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const uUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const pUnsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'users', user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data());
    });

    const predUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), (snap) => {
      setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { vUnsub(); uUnsub(); pUnsub(); predUnsub(); };
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user || !usernameInput.trim()) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'users', user.uid), {
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
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), {
      voteId: selectedVote.id,
      company: selectedVote.company,
      proposal: selectedVote.proposal,
      forecast: Number(forecast),
      rationale,
      createdAt: new Date().toISOString()
    });
    setView('vault');
  };

  if (loading) return <div className="p-10 text-slate-400 font-mono">CONNECTING TO LEDGER...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <Gavel className="text-blue-600" />
            <span className="font-black text-xl tracking-tight uppercase">Finch</span>
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-blue-600' : ''}>Markets</button>
            <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? 'text-blue-600' : ''}>Leaderboard</button>
            {profile && <button onClick={() => setView('vault')} className={view === 'vault' ? 'text-blue-600' : ''}>Vault</button>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!profile ? (
            <button onClick={() => setShowAuthModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">Identity</button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500">{profile.username}</span>
              <button onClick={() => setView('admin')} className="text-slate-300 hover:text-blue-600"><ShieldAlert size={18} /></button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {votes.map(v => (
              <div key={v.id} onClick={() => { setSelectedVote(v); setView('submit'); }} className="bg-white p-6 rounded-2xl border hover:border-blue-500 cursor-pointer transition-all shadow-sm">
                <h3 className="font-black text-lg mb-1">{v.company}</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold uppercase">{v.proposal}</span>
                <p className="text-slate-500 text-sm mt-4 line-clamp-2">{v.description}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl border shadow-xl">
            <h2 className="text-3xl font-black mb-1">{selectedVote.company}</h2>
            <p className="text-blue-600 font-bold text-xs uppercase mb-8">{selectedVote.proposal}</p>
            <div className="text-center mb-10">
              <span className="text-7xl font-black">{forecast}%</span>
              <input type="range" className="w-full mt-6" value={forecast} onChange={e => setForecast(e.target.value)} />
            </div>
            <textarea className="w-full bg-slate-50 p-4 rounded-xl h-32 mb-6" placeholder="Rationale..." onChange={e => setRationale(e.target.value)} />
            <button onClick={submitPrediction} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">File Analysis</button>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            {allUsers.sort((a,b) => a.brierScore - b.brierScore).map((u, i) => (
              <div key={u.id} className="flex justify-between p-6 border-b last:border-0 items-center">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-300">#{i+1}</span>
                  <span className="font-black">{u.username}</span>
                </div>
                <span className="font-mono font-bold text-blue-600">{u.brierScore.toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border">
            <h2 className="font-black text-xl mb-6">New Market</h2>
            <input className="w-full mb-4 border p-3 rounded-lg" placeholder="Company" onChange={e => setNewVote({...newVote, company: e.target.value})} />
            <input className="w-full mb-4 border p-3 rounded-lg" placeholder="Proposal" onChange={e => setNewVote({...newVote, proposal: e.target.value})} />
            <textarea className="w-full mb-4 border p-3 rounded-lg" placeholder="Description" onChange={e => setNewVote({...newVote, description: e.target.value})} />
            <button onClick={async () => {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), { ...newVote, status: 'active' });
              setView('dashboard');
            }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Deploy</button>
          </div>
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
            <h2 className="font-black text-2xl mb-2">Register Analyst</h2>
            <p className="text-slate-500 text-sm mb-6">Choose your market pseudonym.</p>
            <input className="w-full border-2 p-4 rounded-xl mb-4 font-bold" placeholder="Pseudonym" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
            <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Join Ledger</button>
          </div>
        </div>
      )}
    </div>
  );
}