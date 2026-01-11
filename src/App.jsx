import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, getDocs, where, setDoc, orderBy 
} from "firebase/firestore";
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from "firebase/auth";
import { 
  Gavel, ChevronLeft, CheckCircle2, Trophy, ShieldCheck, Zap, 
  ArrowUpRight, Target, Settings, History, LayoutDashboard
} from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCmVG2AVfpZ_b7FdIRcFODHTadQUPXApqo",
  authDomain: "finch-platform.firebaseapp.com",
  projectId: "finch-platform",
  storageBucket: "finch-platform.firebasestorage.app",
  messagingSenderId: "791724581520",
  appId: "1:791724581520:web:bbce4bde4a87da6c2bae15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "finch-pro-prod-v1";

// --- BRIER SCORE CALCULATION ---
const calculateBrier = (forecast, actual) => {
  const f = forecast / 100;
  return Math.pow(f - actual, 2);
};

export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [votes, setVotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  
  // App Interaction State
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Setup State
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  // 1. AUTHENTICATION & PROFILE SYNC
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (!currUser) {
        signInAnonymously(auth);
      } else {
        setUser(currUser);
        const profileRef = doc(db, 'artifacts', appId, 'public', 'users', currUser.uid);
        onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setDoc(profileRef, {
              handle: `Analyst_${currUser.uid.slice(0, 4)}`,
              brierScore: 0.25, // Neutral starting score
              totalVotes: 0,
              points: 1000
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. REAL-TIME DATA STREAMS
  useEffect(() => {
    if (!user) return;
    
    // Stream Global Votes
    const vUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'votes'), (s) => {
      setVotes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Stream Leaderboard
    const uUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'users'), (s) => {
      setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Stream My Personal History (Vault)
    const pUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), (s) => {
      setPredictions(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { vUnsub(); uUnsub(); pUnsub(); };
  }, [user]);

  // 3. ADMIN: MARKET RESOLUTION & BRIER UPDATES
  const resolveMarket = async (voteId, outcome) => {
    const isYes = outcome === 'yes' ? 1 : 0;
    
    // Mark vote as resolved
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'votes', voteId), {
      status: 'resolved',
      outcome: outcome
    });

    // Update scores for everyone who participated
    allUsers.forEach(async (u) => {
      const predQuery = await getDocs(query(
        collection(db, 'artifacts', appId, 'users', u.id, 'predictions'),
        where('voteId', '==', voteId)
      ));

      if (!predQuery.empty) {
        const pData = predQuery.docs[0].data();
        const score = calculateBrier(pData.forecast, isYes);
        
        const newTotal = (u.totalVotes || 0) + 1;
        const currentAgg = (u.brierScore || 0) * (u.totalVotes || 0);
        const newAvg = (currentAgg + score) / newTotal;

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'users', u.id), {
          brierScore: newAvg,
          totalVotes: newTotal,
          points: (u.points || 0) + (score < 0.20 ? 500 : 100)
        });
      }
    });
  };

  const createVote = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'votes'), {
      ...newVote,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    setNewVote({ company: '', proposal: '', description: '' });
    setView('dashboard');
  };

  // 4. ANALYST: SUBMITTING PREDICTIONS
  const handleSubmission = async (e) => {
    e.preventDefault();
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
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  const leaderboard = useMemo(() => {
    return [...allUsers].sort((a, b) => a.brierScore - b.brierScore);
  }, [allUsers]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <nav className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg"><Gavel className="text-white w-5 h-5" /></div>
            <span className="text-xl font-black">FINCH</span>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-indigo-600' : ''}>Markets</button>
            <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? 'text-indigo-600' : ''}>Leaderboard</button>
            <button onClick={() => setView('vault')} className={view === 'vault' ? 'text-indigo-600' : ''}>My Vault</button>
            <button onClick={() => setView('admin')} className="text-rose-500">Admin</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[9px] font-black text-slate-300 uppercase">Mean Brier</p>
            <p className="font-bold text-indigo-600">{profile?.brierScore?.toFixed(4) || '0.2500'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {view === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-6">
              <h1 className="text-4xl font-black mb-8">Active Proxy Ballots</h1>
              {votes.filter(v => v.status === 'active').map(v => (
                <div key={v.id} onClick={() => { setSelectedVote(v); setView('submit'); }} className="bg-white border p-10 rounded-[2.5rem] hover:border-indigo-500 cursor-pointer transition-all">
                  <h3 className="text-2xl font-black">{v.company}</h3>
                  <p className="text-indigo-600 text-xs font-bold uppercase mb-4">{v.proposal}</p>
                  <p className="text-slate-500 text-sm">{v.description}</p>
                </div>
              ))}
            </div>
            <div className="col-span-4">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest">Personal Stats</h4>
                <div className="space-y-4">
                  <p className="text-3xl font-black">{profile?.points || 1000} <span className="text-xs text-slate-500">PRXY</span></p>
                  <p className="text-sm font-bold text-slate-400">{profile?.totalVotes || 0} Forecasts Logged</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-black mb-10 text-center">Analyst Leaderboard</h1>
            <div className="bg-white border rounded-[2.5rem] overflow-hidden">
              {leaderboard.map((u, i) => (
                <div key={i} className="flex justify-between items-center px-10 py-6 border-b border-slate-50 last:border-0">
                   <div className="flex gap-4 items-center">
                     <span className="text-slate-300 font-black">{i+1}</span>
                     <span className="font-bold">{u.handle}</span>
                   </div>
                   <span className="font-black text-indigo-600">{u.brierScore.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="grid grid-cols-2 gap-10">
            <div className="bg-white border p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-black mb-6">Post New Vote</h2>
              <form onSubmit={createVote} className="space-y-4">
                <input className="w-full border p-4 rounded-xl" placeholder="Company" value={newVote.company} onChange={e => setNewVote({...newVote, company: e.target.value})} />
                <input className="w-full border p-4 rounded-xl" placeholder="Proposal" value={newVote.proposal} onChange={e => setNewVote({...newVote, proposal: e.target.value})} />
                <textarea className="w-full border p-4 rounded-xl h-32" placeholder="Context" value={newVote.description} onChange={e => setNewVote({...newVote, description: e.target.value})} />
                <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Launch Market</button>
              </form>
            </div>
            <div className="bg-white border p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-black mb-6">Resolve Market</h2>
              {votes.filter(v => v.status === 'active').map(v => (
                <div key={v.id} className="flex justify-between items-center py-4 border-b">
                   <p className="font-bold text-sm">{v.company}</p>
                   <div className="flex gap-2">
                     <button onClick={() => resolveMarket(v.id, 'yes')} className="bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold">YES</button>
                     <button onClick={() => resolveMarket(v.id, 'no')} className="bg-rose-500 text-white px-3 py-1 rounded text-[10px] font-bold">NO</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-xl mx-auto bg-white border p-12 rounded-[3rem]">
            <form onSubmit={handleSubmission} className="space-y-10">
              <h2 className="text-3xl font-black">{selectedVote.company}</h2>
              <div className="flex justify-between items-end">
                <span className="text-[6xl] font-black text-indigo-600">{forecast}%</span>
              </div>
              <input type="range" className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-indigo-600" value={forecast} onChange={e => setForecast(e.target.value)} />
              <textarea className="w-full border p-6 rounded-2xl h-32" placeholder="Thesis..." value={rationale} onChange={e => setRationale(e.target.value)} />
              <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest">Broadcast Signal</button>
            </form>
          </div>
        )}

        {view === 'vault' && (
          <div className="max-w-2xl mx-auto space-y-4">
             <h1 className="text-4xl font-black mb-10">Your Analysis Vault</h1>
             {predictions.map(p => (
               <div key={p.id} className="bg-white border p-8 rounded-[2.5rem]">
                 <div className="flex justify-between">
                   <p className="font-bold">{p.company}</p>
                   <p className="font-black text-indigo-600">{p.forecast}%</p>
                 </div>
                 <p className="text-slate-400 italic text-sm mt-4">"{p.rationale}"</p>
               </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}