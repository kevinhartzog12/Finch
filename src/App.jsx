import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, getDocs, where, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from "firebase/auth";
import { Gavel, ChevronLeft, ArrowUpRight, LogOut, User, ShieldAlert, Info } from 'lucide-react';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'finch-proxy-v1';

const calculateBrier = (forecast, actual) => {
  const f = forecast / 100;
  return Math.pow(f - actual, 2);
};export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [votes, setVotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('signup'); 
  const [usernameInput, setUsernameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currUser) => setUser(currUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const vUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), (s) => setVotes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const uUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'users'), (s) => setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { vUnsub(); uUnsub(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const pUnsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'users', user.uid), (snap) => setProfile(snap.exists() ? snap.data() : null));
    const predUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), (s) => setPredictions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { pUnsub(); predUnsub(); };
  }, [user]);const handleAuth = async (e) => {
    e.preventDefault();
    if (authType === 'signup') {
      const q = query(collection(db, 'artifacts', appId, 'public', 'users'), where("username", "==", usernameInput));
      const existing = await getDocs(q);
      if (!existing.empty) { setAuthError('Username taken.'); return; }
      await setDoc(doc(db, 'artifacts', appId, 'public', 'users', user.uid), {
        username: usernameInput, brierScore: 0.25, totalVotes: 0, points: 1000, uid: user.uid
      });
    } else {
      const q = query(collection(db, 'artifacts', appId, 'public', 'users'), where("username", "==", usernameInput));
      const res = await getDocs(q);
      if (res.empty) { setAuthError('User not found.'); return; }
      setProfile(res.docs[0].data());
    }
    setShowAuthModal(false);
    setUsernameInput('');
  };

  const launchMarket = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'votes'), { ...newVote, status: 'active', createdAt: new Date().toISOString() });
    setNewVote({ company: '', proposal: '', description: '' });
    setView('dashboard');
  };

  const resolveMarket = async (voteId, outcome) => {
    const isYes = outcome === 'yes' ? 1 : 0;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'votes', voteId), { status: 'resolved', outcome });
    // Scoring logic omitted for brevity in chat, but follows Brier formula
  };

  const submitPrediction = async (e) => {
    e.preventDefault();
    if (!profile) { setAuthType('signup'); setShowAuthModal(true); return; }
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), {
      voteId: selectedVote.id, company: selectedVote.company, proposal: selectedVote.proposal, forecast: Number(forecast), rationale, createdAt: new Date().toISOString()
    });
    setView('vault');
  };return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="h-16 bg-white border-b flex items-center justify-between px-8">
        <div className="flex gap-8 items-center">
          <span className="font-black italic text-indigo-600">FINCH</span>
          <button onClick={() => setView('dashboard')}>Markets</button>
          <button onClick={() => setView('leaderboard')}>Leaderboard</button>
          {profile && <button onClick={() => setView('vault')}>Your Analyses</button>}
          <button onClick={() => setView('admin')} className="text-rose-400">Admin</button>
        </div>
        <div className="flex gap-4">
          {!profile ? (
            <>
              <button onClick={() => { setAuthType('login'); setShowAuthModal(true); }}>Login</button>
              <button onClick={() => { setAuthType('signup'); setShowAuthModal(true); }} className="bg-indigo-600 text-white px-4 py-1 rounded">Sign Up</button>
            </>
          ) : (
            <div className="flex gap-4 items-center">
              <span>{profile.username} ({profile.brierScore.toFixed(4)})</span>
              <button onClick={() => signOut(auth)}><LogOut className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </nav>

      <main className="p-8">
        {view === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Active Ballots</h1>
            {votes.filter(v => v.status === 'active').map(v => (
              <div key={v.id} onClick={() => { setSelectedVote(v); setView('submit'); }} className="bg-white p-6 rounded-xl border mb-4 cursor-pointer">
                <h3 className="text-xl font-bold">{v.company}</h3>
                <p className="text-indigo-600 text-sm">{v.proposal}</p>
              </div>
            ))}
          </div>
        )}
        {/* Additional views (leaderboard, vault, admin) follow same pattern */}
      </main>
    </div>
  );
}