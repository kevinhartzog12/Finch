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
  ArrowUpRight, Target, Settings, History, LayoutDashboard, UserPlus, LogIn
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
  const [authMode, setAuthMode] = useState('onboarding'); 
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVote, setNewVote] = useState({ company: '', proposal: '', description: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'users', currUser.uid);
        onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
            setUser(currUser);
            setAuthMode('authenticated');
          } else {
            setAuthMode('onboarding');
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
        setAuthMode('onboarding');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const vUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'votes'), (s) => {
      setVotes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const uUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'users'), (s) => {
      setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const pUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'predictions'), (s) => {
      setPredictions(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { vUnsub(); uUnsub(); pUnsub(); };
  }, [user]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!usernameInput) return;
    setLoading(true);
    try {
      const { user: newUser } = await signInAnonymously(auth);
      const profileRef = doc(db, 'artifacts', appId, 'public', 'users', newUser.uid);
      await setDoc(profileRef, {
        handle: usernameInput,
        brierScore: 0.25,
        totalVotes: 0,
        points: 1000,
        createdAt: new Date().toISOString()
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const createVote = async (e) => {
    e.preventDefault();
    if (!newVote.company || !newVote.proposal) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'votes'), {
        company: newVote.company,
        proposal: newVote.proposal,
        description: newVote.description,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setNewVote({ company: '', proposal: '', description: '' });
      setView('dashboard');
    } catch (err) { console.error(err); }
  };

  const resolveMarket = async (voteId, outcome) => {
    const isYes = outcome === 'yes' ? 1 : 0;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'votes', voteId), {
      status: 'resolved',
      outcome: outcome
    });
    for (const u of allUsers) {
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
    }
  };

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
    return [...allUsers].filter(u => u.totalVotes > 0).sort((a, b) => a.brierScore - b.brierScore);
  }, [allUsers]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600">LOADING FINCH...</div>;

  if (authMode === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[3rem] p-12 shadow-xl">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl"><Gavel className="text-white w-6 h-6" /></div>
            <span className="text-2xl font-black uppercase">Finch Pro</span>
          </div>
          <h2 className="text-center text-3xl font-black mb-10 tracking-tight">Set Your Handle</h2>
          <form onSubmit={handleSignUp} className="space-y-6">
            <input 
              className="w-full border-2 border-slate-50 bg-slate-50 p-6 rounded-3xl outline-none focus:border-indigo-500 font-bold"
              placeholder="@analyst_name"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-600 flex items-center justify-center gap-3">
              Enter Platform <ArrowUpRight />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <nav className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg"><Gavel className="text-white w-5 h-5" /></div>
            <span className="text-xl font-black">FINCH</span>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-indigo-600' : ''}>Markets</button>
            <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? 'text-indigo-600' : ''}>Leaderboard</button>
            <button onClick={() => setView('vault')} className={view === 'vault' ? 'text-indigo-600' : ''}>Your Analyses</button>
            <button onClick={() => setView('admin')} className="text-rose-500">Admin</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Mean Brier</p>
            <p className="font-bold text-indigo-600 leading-none">{profile?.brierScore?.toFixed(4) || '0.2500'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-400">
            {profile?.handle?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {view === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-6">
              <h1 className="text-5xl font-black tracking-tight mb-8">Open Markets</h1>
              {votes.filter(v => v.status === 'active').map(v => (
                <div key={v.id} onClick={() => { setSelectedVote(v); setView('submit'); }} className="bg-white border p-10 rounded-[3rem] hover:border-indigo-500 cursor-pointer transition-all shadow-sm">
                  <h3 className="text-3xl font-black mb-2">{v.company}</h3>
                  <p className="text-indigo-600 text-xs font-black uppercase mb-4">{v.proposal}</p>
                  <p className="text-slate-500 text-sm line-clamp-2">{v.description}</p>
                </div>
              ))}
            </div>
            <div className="col-span-4">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-8">Analyst: {profile?.handle}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Points</p>
                <p className="text-4xl font-black mb-6">{profile?.points?.toLocaleString()} PRXY</p>
                <div className="pt-6 border-t border-white/5 flex justify-between">
                  <div><p className="text-[9px] text-slate-500 uppercase">Brier</p><p className="text-xl font-bold">{profile?.brierScore?.toFixed(4)}</p></div>
                  <div className="text-right"><p className="text-[9px] text-slate-500 uppercase">Count</p><p className="text-xl font-bold">{profile?.totalVotes}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-5xl font-black mb-12 text-center">Leaderboard</h1>
            <div className="bg-white border rounded-[3rem] overflow-hidden shadow-sm">
              {leaderboard.map((u, i) => (
                <div key={i} className="flex justify-between items-center px-10 py-8 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                   <div className="flex gap-6 items-center">
                     <span className="text-xl font-black text-slate-200">{i+1}</span>
                     <span className="font-bold text-lg">{u.handle}</span>
                   </div>
                   <span className="font-black text-xl text-indigo-600">{u.brierScore.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="grid grid-cols-2 gap-10">
            <div className="bg-white border p-12 rounded-[3.5rem]">
              <h2 className="text-3xl font-black mb-8">Launch Ballot</h2>
              <form onSubmit={createVote} className="space-y-4">
                <input className="w-full border p-5 rounded-2xl" placeholder="Company" value={newVote.company} onChange={e => setNewVote({...newVote, company: e.target.value})} />
                <input className="w-full border p-5 rounded-2xl" placeholder="Proposal" value={newVote.proposal} onChange={e => setNewVote({...newVote, proposal: e.target.value})} />
                <textarea className="w-full border p-5 rounded-2xl h-40" placeholder="Context" value={newVote.description} onChange={e => setNewVote({...newVote, description: e.target.value})} />
                <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl">Launch Market</button>
              </form>
            </div>
            <div className="bg-white border p-12 rounded-[3.5rem]">
              <h2 className="text-3xl font-black mb-8">Resolve Market</h2>
              <div className="space-y-4">
                {votes.filter(v => v.status === 'active').map(v => (
                  <div key={v.id} className="p-6 border rounded-[2rem] flex justify-between items-center">
                     <div>
                       <p className="font-bold">{v.company}</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black">{v.proposal}</p>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => resolveMarket(v.id, 'yes')} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black">Pass</button>
                       <button onClick={() => resolveMarket(v.id, 'no')} className="bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-black">Fail</button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-xl mx-auto bg-white border p-12 rounded-[4rem]">
            <form onSubmit={handleSubmission} className="space-y-12">
              <h2 className="text-4xl font-black">{selectedVote.company}</h2>
              <div className="flex justify-between items-end">
                <span className="text-8xl font-black text-indigo-600">{forecast}%</span>
              </div>
              <input type="range" className="w-full h-3 bg-slate-100 rounded-full appearance-none accent-indigo-600" value={forecast} onChange={e => setForecast(e.target.value)} />
              <textarea className="w-full border-2 p-8 rounded-[2.5rem] h-48 focus:border-indigo-500 outline-none" placeholder="Qualitative thesis..." value={rationale} onChange={e => setRationale(e.target.value)} />
              <button className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase shadow-xl hover:bg-indigo-600 transition-all">Broadcast Prediction</button>
            </form>
          </div>
        )}

        {view === 'vault' && (
          <div className="max-w-2xl mx-auto space-y-6">
             <h1 className="text-5xl font-black mb-12">Your Analyses</h1>
             {predictions.map(p => {
               const vMeta = votes.find(v => v.id === p.voteId);
               return (
                 <div key={p.id} className="bg-white border p-10 rounded-[3rem] shadow-sm">
                   <div className="flex justify-between items-start mb-6">
                     <div>
                       <p className="font-black text-2xl">{p.company}</p>
                       <p className="text-indigo-600 font-black text-[10px] uppercase">{p.proposal}</p>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-3xl">{p.forecast}%</p>
                        {vMeta?.status === 'resolved' && (
                          <div className={`text-[10px] font-black uppercase mt-1 ${vMeta.outcome === (p.forecast > 50 ? 'yes' : 'no') ? 'text-emerald-500' : 'text-rose-500'}`}>
                            Market {vMeta.outcome.toUpperCase()}
                          </div>
                        )}
                     </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-2xl italic text-slate-500 text-sm border border-slate-100 italic">
                     "{p.rationale}"
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </main>
    </div>
  );
}