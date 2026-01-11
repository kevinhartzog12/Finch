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
  Search,
  TrendingUp
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
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'submit'
  const [selectedVote, setSelectedVote] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [forecast, setForecast] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
  };

  const submitAnalysis = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate Blockchain transaction
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Gavel className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
              Finch
            </span>
          </div>
          <button 
            onClick={handleConnect} 
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            {wallet ? `${wallet.substring(0,6)}...${wallet.substring(38)}` : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content: Vote List */}
            <div className="lg:col-span-2 space-y-8">
              <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Proxy Votes</h1>
                <p className="text-slate-500 mt-2 text-lg">Predict governance outcomes, stake tokens, and build your reputation score.</p>
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
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Brier Score</p>
                    <p className="text-2xl font-black">--</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">STAKED FINCH</p>
                    <p className="text-2xl font-black">500</p>
                  </div>
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
                        <div className="text-[9px] uppercase font-bold text-slate-400">Accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  Your forecast and 100 FINCH tokens have been committed to the vault.
                </p>
                <button 
                  onClick={() => setView('dashboard')} 
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Return Home
                </button>
              </div>
            ) : (
              <form onSubmit={submitAnalysis} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedVote.company}</h2>
                  <p className="text-indigo-600 font-black uppercase tracking-widest text-sm mt-1">{selectedVote.proposal}</p>
                </div>
                
                <div className="p-8 space-y-10">
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
                        Submitting this forecast requires a stake of 100 FINCH. Inaccurate predictions outside the 15% error margin will result in a reputation slash.
                      </p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-5 rounded-2xl font-black text-xl text-white shadow-xl transition-all ${
                      isSubmitting 
                        ? 'bg-slate-400 animate-pulse cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting ? 'Writing to Chain...' : 'Stake 100 FINCH & Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}