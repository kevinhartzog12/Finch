import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc 
} from "firebase/firestore";
import { 
  Gavel, 
  Wallet, 
  ChevronLeft, 
  User, 
  CheckCircle2, 
  TrendingUp,
  Award,
  BarChart3,
  Trophy,
  History,
  LayoutDashboard
} from 'lucide-react';

// --- PASTE YOUR ACTUAL FIREBASE CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyCmVG2AVfpZ_b7FdIRcFODHTadQUPXApqo",
  authDomain: "finch-platform.firebaseapp.com",
  projectId: "finch-platform",
  storageBucket: "finch-platform.firebasestorage.app",
  messagingSenderId: "791724581520",
  appId: "1:791724581520:web:bbce4bde4a87da6c2bae15"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOCK_VOTES = [
  { 
    id: 1, 
    company: "MegaCorp Inc.", 
    proposal: "Spin-off Cloud Division", 
    description: "Shareholder proposal to separate the high-growth Cloud entity to unlock value and streamline core operations.", 
    currentProbability: 32 
  },
  { 
    id: 2, 
    company: "EcoEnergy Ltd.", 
    proposal: "Appoint ESG Specialist", 
    description: "Activist investor seeking to place a climate-risk expert on the board to oversee transition strategy.", 
    currentProbability: 68 
  },
  { 
    id: 3, 
    company: "TechGiant Co.", 
    proposal: "Executive Clawback Policy", 
    description: "Mandate recovery of executive bonuses in the event of material financial restatements or misconduct.", 
    currentProbability: 45 
  }
];

const MOCK_LEADERS = [
  { rank: 1, name: "Alpha_Analyst", accuracy: 88, returns: "+12,400", color: "bg-amber-100 text-amber-600" },
  { rank: 2, name: "ProxyWhale", accuracy: 82, returns: "+9,100", color: "bg-slate-100 text-slate-600" },
  { rank: 3, name: "GovernanceGuru", accuracy: 79, returns: "+7,250", color: "bg-orange-100 text-orange-600" },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedVote, setSelectedVote] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myPredictions, setMyPredictions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // Stores the username
  const [authMode, setAuthMode] = useState(null); // 'login' or 'signup'
  const [authInput, setAuthInput] = useState(""); // The text in the username field
  const [authError, setAuthError] = useState("");

  // FETCH DATA FROM FIREBASE (REAL-TIME)
  useEffect(() => {
    const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const preds = [];
      querySnapshot.forEach((doc) => {
        preds.push({ id: doc.id, ...doc.data() });
      });
      setMyPredictions(preds);
      setBalance(1000 - (preds.length * 100));
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const submitAnalysis = async (e) => {
    e.preventDefault();
    if (!wallet || balance < 100) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "predictions"), {
        company: selectedVote.company,
        proposal: selectedVote.proposal,
        forecast: Number(forecast),
        rationale: rationale,
        staked: 100,
        createdAt: new Date().toISOString(),
        status: 'Pending Outcome'
      });
      setIsSubmitting(false);
      setSuccess(true);
    } catch (error) {
      console.error("Database Error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="bg-indigo-600 p-2 rounded-lg"><Gavel className="text-white w-5 h-5" /></div>
          <span className="text-xl font-black tracking-tight">Finch</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex gap-6 text-sm font-bold uppercase tracking-widest">
            <button onClick={() => setView('dashboard')} className={`flex items-center gap-1.5 transition-colors ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutDashboard className="w-4 h-4" /> Market
            </button>
            <button onClick={() => setView('leaderboard')} className={`flex items-center gap-1.5 transition-colors ${view === 'leaderboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Trophy className="w-4 h-4" /> Leaders
            </button>
            <button onClick={() => setView('history')} className={`flex items-center gap-1.5 transition-colors ${view === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <History className="w-4 h-4" /> History
            </button>
          </div>
           <div className="flex items-center gap-4">
  {currentUser ? (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-600">@{currentUser}</span>
      <button 
        onClick={() => { setCurrentUser(null); setBalance(0); }} 
        className="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
      >
        Logout
      </button>
    </div>
  ) : (
    <>
      <button 
        onClick={() => { setAuthMode('login'); setAuthError(""); }}
        className="text-sm font-bold text-slate-600 hover:text-indigo-600"
      >
        Login
      </button>
      <button 
        onClick={() => { setAuthMode('signup'); setAuthError(""); }}
        className="px-5 py-2.5 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
      >
        Sign Up
      </button>
    </>
  )}
</div>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-black mb-2">Active Proxy Votes</h1>
                <p className="text-slate-500 font-medium text-lg italic">Crowdsourced governance intelligence.</p>
              </div>

              <div className="space-y-4">
                {MOCK_VOTES.map(vote => (
                  <div key={vote.id} onClick={() => { setSelectedVote(vote); setView('submit'); setSuccess(false); setRationale(""); }} className="group bg-white border border-slate-200 p-8 rounded-[2rem] hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{vote.company}</h3>
                        <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mt-1">{vote.proposal}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900">{vote.currentProbability}%</span>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Market View</p>
                      </div>
                    </div>
                    <p className="text-slate-500 leading-relaxed max-w-2xl">{vote.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                <h4 className="font-bold mb-6 flex items-center gap-2 text-indigo-100 uppercase tracking-widest text-[10px]">
                  <User className="w-3.5 h-3.5" /> Analyst Stats
                </h4>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black">{wallet ? balance : '—'}</span>
                    <span className="text-indigo-200 font-black mb-2 uppercase text-[10px] tracking-[0.3em]">PRXY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] text-indigo-200 uppercase font-black mb-1 tracking-tighter">My Rank</p>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-300" />
                        <p className="text-xl font-bold">{wallet ? '#42' : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] text-indigo-200 uppercase font-black mb-1 tracking-tighter">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                        <p className="text-xl font-bold">{wallet ? '74%' : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black mb-4">Top Analysts</h1>
              <p className="text-slate-500 font-medium">Rankings based on prediction accuracy and PRXY returns.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 bg-slate-50 px-8 py-4 border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Analyst</div>
                <div className="col-span-3 text-center">Accuracy</div>
                <div className="col-span-3 text-right">Returns (PRXY)</div>
              </div>
              {MOCK_LEADERS.map((leader, i) => (
                <div key={i} className="grid grid-cols-12 px-8 py-6 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${leader.color}`}>{leader.rank}</div>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <span className="font-bold">{leader.name}</span>
                  </div>
                  <div className="col-span-3 text-center font-black text-indigo-600 text-lg">{leader.accuracy}%</div>
                  <div className="col-span-3 text-right font-black text-emerald-600">{leader.returns}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-4xl font-black tracking-tight">Vault</h1>
            {myPredictions.length === 0 ? (
              <div className="text-center p-24 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
                <p className="font-bold text-lg">The vault is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myPredictions.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex justify-between items-center hover:shadow-lg transition-all">
                    <div className="flex-1 pr-6">
                      <h3 className="font-black text-xl">{p.company}</h3>
                      <p className="text-slate-500 text-sm italic line-clamp-2">"{p.rationale}"</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black text-slate-900 tabular-nums">{p.forecast}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setView('dashboard')} className="mb-10 flex items-center gap-2 font-black text-slate-300 hover:text-indigo-600 transition-all uppercase text-[10px] tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Cancel Submission
            </button>
            
            {success ? (
              <div className="text-center bg-white p-20 rounded-[4rem] border border-slate-200 shadow-2xl">
                <h2 className="text-4xl font-black mb-4">Confirmed</h2>
                <button onClick={() => setView('history')} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all">Open Vault</button>
              </div>
            ) : (
              <form onSubmit={submitAnalysis} className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-sm space-y-12">
                {!wallet && (
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4 items-center">
                    <Wallet className="text-amber-500 w-8 h-8" />
                    <p className="text-amber-900 font-bold">Wallet Connection Required to Stake</p>
                  </div>
                )}
                <h2 className="text-4xl font-black mb-2">{selectedVote.company}</h2>
                <div className="space-y-6">
                  <span className="text-7xl font-black text-indigo-600 tabular-nums">{forecast}%</span>
                  <input type="range" className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" value={forecast} onChange={(e) => setForecast(e.target.value)} />
                </div>
                <textarea className="w-full border border-slate-200 p-8 rounded-[2.5rem] outline-none focus:border-indigo-500 transition-all text-lg leading-relaxed min-h-[200px]" value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Provide your thesis..." required />
                <button type="submit" disabled={isSubmitting || !wallet} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-600 transition-all disabled:bg-slate-200 shadow-xl">
                  {isSubmitting ? 'Syncing...' : 'Stake 100 PRXY'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}