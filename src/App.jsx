import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  Wallet, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  BarChart3, 
  User, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  History,
  LayoutDashboard
} from 'lucide-react';

// --- Mock Data ---
const MOCK_VOTES = [
  { 
    id: 1, 
    company: "MegaCorp Inc.", 
    proposal: "Spin-off Cloud Division", 
    description: "Shareholder proposal to separate the high-growth Cloud entity to unlock value. Management opposes the move, citing integration benefits.", 
    deadline: "2024-06-15", 
    status: "Active", 
    currentProbability: 32 
  },
  { 
    id: 2, 
    company: "EcoEnergy Ltd.", 
    proposal: "Appoint ESG Specialist", 
    description: "Activist investor seeking to place a climate-risk expert on the board of directors to oversee the transition to renewables.", 
    deadline: "2024-06-20", 
    status: "Active", 
    currentProbability: 68 
  },
  { 
    id: 3, 
    company: "TechGiant Co.", 
    proposal: "Executive Clawback Policy", 
    description: "Mandate recovery of executive bonuses in the event of financial restatements or significant regulatory failures.", 
    deadline: "2024-06-22", 
    status: "Active", 
    currentProbability: 45 
  }
];

const MOCK_LEADERBOARD = [
  { id: 1, name: "Analyst_Alpha", score: 0.082, predictions: 12, rank: 1 },
  { id: 2, name: "Governance_Guru", score: 0.115, predictions: 8, rank: 2 },
  { id: 3, name: "ValueSeeker", score: 0.142, predictions: 15, rank: 3 }
];

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'submit' | 'history'
  const [selectedVote, setSelectedVote] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(1000); // Initial PRXY Balance
  const [forecast, setForecast] = useState(50);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Local state for user's predictions
  const [myPredictions, setMyPredictions] = useState([]);

  const handleConnect = () => {
    setWallet(wallet ? null : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
  };

  const openSubmission = (vote) => {
    if (!wallet) {
      alert("Please connect your wallet first to submit an analysis.");
      return;
    }
    setSelectedVote(vote);
    setView('submit');
    setSuccess(false);
    setRationale("");
  };

  const submitAnalysis = (e) => {
    e.preventDefault();
    if (balance < 100) {
      alert("Insufficient PRXY balance to stake.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate Blockchain transaction
    setTimeout(() => {
      const newPrediction = {
        id: Date.now(),
        company: selectedVote.company,
        proposal: selectedVote.proposal,
        forecast: forecast,
        rationale: rationale,
        staked: 100,
        date: new Date().toLocaleDateString(),
        status: 'Pending Outcome'
      };

      setMyPredictions([newPrediction, ...myPredictions]);
      setBalance(prev => prev - 100); // Deduct balance
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Gavel className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
              Finch
            </span>
          </div>

          <div className="flex items-center gap-6">
            {wallet && (
              <div className="hidden md:flex items-center gap-4 text-sm font-bold text-slate-500">
                <button 
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1 ${view === 'dashboard' ? 'text-indigo-600' : 'hover:text-slate-800'}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Market
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`flex items-center gap-1 ${view === 'history' ? 'text-indigo-600' : 'hover:text-slate-800'}`}
                >
                  <History className="w-4 h-4" /> History
                </button>
              </div>
            )}
            <button 
              onClick={handleConnect} 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              {wallet ? `${wallet.substring(0,6)}...${wallet.substring(38)}` : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content: Vote List */}
            <div className="lg:col-span-2 space-y-8">
              <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Proxy Votes</h1>
                <p className="text-slate-500 mt-2 text-lg">Predict governance outcomes and earn reputation for accuracy.</p>
              </header>

              <div className="grid gap-6">
                {MOCK_VOTES.map(vote => (
                  <div 
                    key={vote.id} 
                    onClick={() => openSubmission(vote)} 
                    className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-indigo-400 cursor-pointer transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{vote.company}</h3>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
                          {vote.proposal}
                        </span>
                      </div>
                      <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-indigo-500" />
                        {vote.currentProbability}% Market Probability
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed max-w-2xl">
                      {vote.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                        Deadline: {vote.deadline}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-600 font-bold text-sm">
                        Analyze Outcome <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Profile & Leaderboard */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-200" /> Your Analyst Profile
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">PRXY Balance</p>
                    <p className="text-2xl font-black">{balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Analyses</p>
                    <p className="text-2xl font-black">{myPredictions.length}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                   <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Global Accuracy Rank</p>
                   <p className="text-sm font-bold">Unranked (Need 5+ predictions)</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold flex items-center gap-2">
                    <Award className="text-amber-500 w-5 h-5" /> Top Analysts
                  </h3>
                  <BarChart3 className="w-4 h-4 text-slate-300" />
                </div>
                <div className="divide-y divide-slate-50">
                  {MOCK_LEADERBOARD.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-300 w-4">#{user.rank}</span>
                        <div className="text-sm font-bold text-slate-700">{user.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-indigo-600">{user.score}</div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">Brier Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : view === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Prediction History</h1>
                  <p className="text-slate-500 mt-2 text-lg">Track your accuracy and pending reputation rewards.</p>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors"
                >
                  Back to Market
                </button>
             </header>

             {myPredictions.length === 0 ? (
               <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold text-lg">No predictions yet.</p>
                  <button onClick={() => setView('dashboard')} className="text-indigo-600 font-bold mt-2">Start analyzing votes</button>
               </div>
             ) : (
               <div className="grid gap-4">
                  {myPredictions.map(pred => (
                    <div key={pred.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-slate-900">{pred.company}</h3>
                             <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">{pred.proposal}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">Submitted on {pred.date}</p>
                          <p className="text-sm text-slate-600 mt-2 italic">"{pred.rationale.substring(0, 80)}..."</p>
                       </div>
                       <div className="flex gap-8 text-center shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                          <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Forecast</p>
                             <p className="text-xl font-black text-indigo-600">{pred.forecast}%</p>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Staked</p>
                             <p className="text-xl font-black text-slate-700">{pred.staked} PRXY</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                             <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-tight">{pred.status}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        ) : (
          /* Submission View */
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setView('dashboard')} 
              className="flex items-center gap-1 text-slate-400 font-bold mb-8 hover:text-indigo-600 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
              Back to Market
            </button>
            
            {success ? (
              <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-2xl">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Analysis Staked!</h2>
                <p className="text-slate-500 mb-8 font-medium">
                  Your forecast has been committed. 100 PRXY has been deducted from your balance.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setView('dashboard')} 
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Return Home
                  </button>
                  <button 
                    onClick={() => setView('history')} 
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    View History
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAnalysis} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedVote.company}</h2>
                  <p className="text-indigo-600 font-black uppercase tracking-widest text-sm mt-1">{selectedVote.proposal}</p>
                </div>
                
                <div className="p-8 space-y-10">
                  <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl">
                    <span className="text-sm font-bold text-indigo-700 uppercase tracking-tight">Available Balance</span>
                    <span className="text-xl font-black text-indigo-700">{balance.toLocaleString()} PRXY</span>
                  </div>

                  {/* Probability Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-tight">Your Pass Probability</label>
                      <span className="text-5xl font-black text-indigo-600">{forecast}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={forecast} 
                      onChange={(e) => setForecast(e.target.value)}
                      className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Will Fail (0%)</span>
                      <span>Neutral (50%)</span>
                      <span>Will Pass (100%)</span>
                    </div>
                  </div>

                  {/* Rationale Text */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-tight">Investment Rationale</label>
                    <textarea 
                      required 
                      rows="5" 
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-medium text-sm"
                      placeholder="Analyze management's position vs activist pressure..."
                    ></textarea>
                  </div>

                  {/* Warning/Stake Info */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">Staking Requirement</p>
                      <p className="text-xs text-amber-700 font-medium">
                        Submitting this forecast requires a stake of 100 PRXY. Inaccurate predictions will result in a balance deduction after the vote settles.
                      </p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || balance < 100}
                    className={`w-full py-5 rounded-2xl font-black text-xl text-white shadow-xl transition-all ${
                      isSubmitting || balance < 100
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting ? 'Writing to Chain...' : `Stake 100 PRXY & Submit`}
                  </button>
                  {balance < 100 && (
                    <p className="text-center text-red-500 font-bold text-xs uppercase tracking-tight mt-2">Insufficient Balance</p>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}