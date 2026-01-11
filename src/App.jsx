import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy,
  onSnapshot 
} from "firebase/firestore";
import { 
  Gavel, 
  Wallet, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  CheckCircle2, 
  TrendingUp
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
  { id: 1, company: "MegaCorp Inc.", proposal: "Spin-off Cloud Division", description: "Shareholder proposal to separate the high-growth Cloud entity to unlock value.", currentProbability: 32 },
  { id: 2, company: "EcoEnergy Ltd.", proposal: "Appoint ESG Specialist", description: "Activist investor seeking to place a climate-risk expert on the board.", currentProbability: 68 },
  { id: 3, company: "TechGiant Co.", proposal: "Executive Clawback Policy", description: "Mandate recovery of executive bonuses in the event of financial restatements.", currentProbability: 45 }
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

  const handleConnect = () => setWallet(wallet ? null : "0x71C7...976F");

  const submitAnalysis = async (e) => {
    e.preventDefault();
    if (balance < 100) return;
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
          <span className="text-xl font-black">Finch</span>
        </div>
        <div className="flex items-center gap-4">
          {wallet && (
            <div className="flex gap-4 text-sm font-bold">
              <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'}>Market</button>
              <button onClick={() => setView('history')} className={view === 'history' ? 'text-indigo-600' : 'text-slate-500'}>History</button>
            </div>
          )}
          <button onClick={handleConnect} className="px-4 py-2 rounded-full text-sm font-bold bg-indigo-600 text-white">
            {wallet ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-4xl font-black">Active Proxy Votes</h1>
              {MOCK_VOTES.map(vote => (
                <div key={vote.id} onClick={() => { if(!wallet) return; setSelectedVote(vote); setView('submit'); setSuccess(false); setRationale(""); }} className="bg-white border p-6 rounded-2xl hover:border-indigo-400 cursor-pointer shadow-sm transition-all">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-xl font-bold">{vote.company}</h3>
                    <span className="text-indigo-600 font-bold">{vote.currentProbability}%</span>
                  </div>
                  <p className="text-slate-600 text-sm">{vote.description}</p>
                </div>
              ))}
            </div>
            <div className="bg-indigo-600 rounded-3xl p-6 text-white h-fit shadow-xl">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-100"><User className="w-5" /> Profile</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-indigo-200">Balance</p>
                  <p className="text-xl font-bold">{balance}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-indigo-200">Predictions</p>
                  <p className="text-xl font-bold">{myPredictions.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black">My Submissions</h1>
              <button onClick={() => setView('dashboard')} className="text-sm font-bold text-slate-500">Back</button>
            </div>
            {myPredictions.length === 0 ? (
              <div className="text-center p-12 bg-white border border-dashed rounded-3xl text-slate-400">
                No submissions found.
              </div>
            ) : (
              <div className="space-y-4">
                {myPredictions.map(p => (
                  <div key={p.id} className="bg-white border p-6 rounded-2xl flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{p.company}</p>
                      <p className="text-sm text-slate-500 line-clamp-2 italic">"{p.rationale}"</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-black text-indigo-600">{p.forecast}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'submit' && selectedVote && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setView('dashboard')} className="mb-6 flex items-center gap-1 font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Market
            </button>
            {success ? (
              <div className="text-center bg-white p-12 rounded-3xl border shadow-xl">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Submission Recorded!</h2>
                <button onClick={() => setView('history')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">View History</button>
              </div>
            ) : (
              <form onSubmit={submitAnalysis} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">{selectedVote.company}</h2>
                  <p className="text-indigo-600 text-sm font-bold uppercase">{selectedVote.proposal}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between font-bold text-slate-700">
                    <label>Pass Probability</label>
                    <span className="text-4xl text-indigo-600">{forecast}%</span>
                  </div>
                  <input type="range" className="w-full" value={forecast} onChange={(e) => setForecast(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase">Rationale</label>
                  <textarea className="w-full border border-slate-200 p-4 rounded-2xl" rows="5" value={rationale} onChange={(e) => setRationale(e.target.value)} required />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl">
                  {isSubmitting ? 'Writing to Cloud...' : 'Stake 100 PRXY'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}