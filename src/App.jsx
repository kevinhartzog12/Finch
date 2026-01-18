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
  setDoc,
  deleteDoc
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
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Stores the username
  const [authMode, setAuthMode] = useState(null); // 'login' or 'signup'
  const [authInput, setAuthInput] = useState(""); // The text in the username field
  const [authError, setAuthError] = useState("");
  const [votes, setVotes] = useState([]);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [editingVote, setEditingVote] = useState(null); // Track if we are editing an existing vote
  const [voteForm, setVoteForm] = useState({
    company: "",
    proposal: "",
    summary: "",
    resolveBy: "",
    status: "active", // New: 'active' or 'resolved'
    outcome: null     // New: 1 for PASSED, 0 for FAILED
  });
  // FETCH DATA FROM FIREBASE (REAL-TIME)
  useEffect(() => {
    // Only fetch if someone is logged in
    if (!currentUser) {
      setMyPredictions([]);
      return;
    }

    // New query: Filter by the logged-in username
    const q = query(
      collection(db, "predictions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const preds = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only add to the list if the username matches
        if (data.username === currentUser) {
          preds.push({ id: doc.id, ...data });
        }
      });
      setMyPredictions(preds);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [currentUser]); // Added currentUser here so it re-runs when you switch users

  // Dedicated listener for the logged-in user's balance
  useEffect(() => {
    if (!currentUser) {
      setBalance(0); // Reset balance on logout
      return;
    }

    // Reference to the specific user's document
    const userRef = doc(db, "users", currentUser);

    // Listen for changes to THIS user only
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setBalance(userData.balance); // Update the screen with the DB balance
      }
    }, (error) => {
      console.error("Error fetching user balance:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const q = query(collection(db, "votes"), orderBy("company", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const votesData = [];
      querySnapshot.forEach((doc) => {
        votesData.push({ id: doc.id, ...doc.data() });
      });
      setVotes(votesData);
    }, (error) => console.error("Error fetching votes:", error));

    return () => unsubscribe();
  }, []);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVote) {
        // UPDATE existing vote
        const voteRef = doc(db, "votes", editingVote);
        await setDoc(voteRef, voteForm, { merge: true });
      } else {
        // CREATE new vote
        await addDoc(collection(db, "votes"), {
          ...voteForm,
          currentProbability: 50, // Default starting point
          createdAt: new Date().toISOString()
        });
      }
      setIsVoteModalOpen(false);
      setVoteForm({ company: "", proposal: "", summary: "", resolveBy: "" });
    } catch (err) {
      console.error("Error saving vote:", err);
      alert("Failed to save vote.");
    }
  };

  const deleteVote = async (id) => {
    if (window.confirm("Are you sure you want to delete this vote? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "votes", id));
      } catch (err) {
        console.error("Error deleting vote:", err);
        alert("Failed to delete vote.");
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const userRef = doc(db, "users", authInput.toLowerCase());

    try {
      const userSnap = await getDoc(userRef);

      if (authMode === 'signup') {
        if (userSnap.exists()) {
          setAuthError("Username already taken.");
        } else {
          await setDoc(userRef, {
            username: authInput.toLowerCase(),
            balance: 1000,
            createdAt: new Date().toISOString()
          });
          setCurrentUser(authInput.toLowerCase());
          setBalance(1000);
          setAuthMode(null);
        }
      } else {
        // --- LOGIN LOGIC ---
        if (userSnap.exists()) {
          const userData = userSnap.data();

          // 1. Set the user
          setCurrentUser(authInput.toLowerCase());

          // 2. Set the balance immediately from the database
          setBalance(userData.balance);

          // 3. Clear the modal
          setAuthMode(null);
          setAuthInput(""); // Clear the input field for next time
        } else {
          setAuthError("Account does not exist.");
        }
      }
    } catch (err) {
      setAuthError("Authentication failed.");
      console.error(err);
    }
  };

  const finalizeResolution = async (outcomeValue) => {
    if (!window.confirm("Are you sure? This will finalize scores for all users and close the market.")) return;

    try {
      // 1. Update the Vote document first
      const voteRef = doc(db, "votes", editingVote);
      await setDoc(voteRef, {
        status: 'resolved',
        outcome: outcomeValue
      }, { merge: true });

      // 2. Find predictions. 
      // We try to find them by voteId, but if that's missing (old tests), we skip scoring.
      const predsQuery = query(collection(db, "predictions"), where("voteId", "==", editingVote));
      const predsSnap = await getDocs(predsQuery);

      // 3. Loop through and score
      for (const predDoc of predsSnap.docs) {
        const predData = predDoc.data();

        // Calculate Brier Score
        const f = (predData.forecast || 50) / 100; // Default to 50 if forecast missing
        const o = outcomeValue;
        const brierScore = Math.pow((f - o), 2);

        // Update User Profile
        const userRef = doc(db, "users", predData.username);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentAvg = userData.avgBrierScore || 0;
          const currentCount = userData.resolvedVotesCount || 0;

          const newCount = currentCount + 1;
          const newAvg = ((currentAvg * currentCount) + brierScore) / newCount;

          await setDoc(userRef, {
            avgBrierScore: newAvg,
            resolvedVotesCount: newCount
          }, { merge: true });
        }
      }

      // Success! Close modal and reset
      setIsResolutionModalOpen(false);
      setEditingVote(null);
      alert("Market Resolved successfully!"); // Added success confirmation

    } catch (err) {
      console.error("Resolution Error Details:", err);
      alert("The vote status updated, but there was an error calculating user scores. Check console for details.");
    }
  };

  const submitAnalysis = async (e) => {
    e.preventDefault();

    // Check if the user already has a report for THIS specific vote
    const hasAlreadyVoted = myPredictions.some(p =>
      p.company === selectedVote.company &&
      p.proposal === selectedVote.proposal
    );

    if (hasAlreadyVoted) {
      alert("You have already submitted an analysis for this proxy vote. You can only stake once per event.");
      return;
    }

    if (balance < 100) {
      alert("Insufficient PRXY balance to stake analysis.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Record the prediction
      await addDoc(collection(db, "predictions"), {
        username: currentUser, // Track who made it
        company: selectedVote.company,
        proposal: selectedVote.proposal,
        forecast: Number(forecast),
        rationale: rationale,
        staked: 100,
        createdAt: new Date().toISOString(),
        status: 'Pending Outcome'
      });

      // 2. Deduct 100 PRXY from the "Bank of Finch"
      const userRef = doc(db, "users", currentUser);
      const newBalance = balance - 100;
      await setDoc(userRef, { balance: newBalance }, { merge: true });

      // 3. Update local state
      setBalance(newBalance);
      setIsSubmitting(false);
      setSuccess(true);
    } catch (error) {
      console.error("Database Error:", error);
      setIsSubmitting(false);
      alert("Error processing stake. Try again.");
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
              <History className="w-4 h-4" /> Reports
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
                  onClick={() => { setAuthMode('login'); setAuthError(""); setAuthInput(""); }} // Add setAuthInput("")
                  className="..."
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setAuthInput(""); setAuthError(""); }}
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* AUTH MODAL POPUP */}
      {authMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl relative">
            <h2 className="text-3xl font-black mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 mb-8">
              {authMode === 'login' ? 'Enter your username to sync.' : 'Pick a username to get 1,000 PRXY.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <input
                autoFocus
                className="w-full border-2 border-slate-100 p-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                placeholder="Username"
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                required
              />

              {authError && (
                <p className="text-red-500 text-sm font-bold px-2 italic">
                  {authError}
                </p>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                {authMode === 'login' ? 'Login' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode(null)}
                className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED RESOLUTION MODAL */}
      {isResolutionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2 text-slate-900">Resolve Market</h2>
              <p className="text-slate-500 font-medium">Finalize outcome for <span className="text-indigo-600 font-bold">{voteForm.company}</span></p>
            </div>

            <div className="grid gap-4 mb-8">
              <button
                onClick={() => finalizeResolution(1)} // 1 = Passed
                className="group p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600">Outcome A</p>
                <p className="text-2xl font-black text-slate-900">PROPOSAL PASSED</p>
              </button>

              <button
                onClick={() => finalizeResolution(0)} // 0 = Failed
                className="group p-6 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all text-left"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-red-600">Outcome B</p>
                <p className="text-2xl font-black text-slate-900">PROPOSAL FAILED</p>
              </button>
            </div>

            <button
              onClick={() => setIsResolutionModalOpen(false)}
              className="text-slate-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* ADMIN CREATE/EDIT MODAL */}
      {isVoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-6">
              {editingVote ? 'Edit Vote Event' : 'New Proxy Event'}
            </h2>

            <form onSubmit={handleVoteSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Company Name</label>
                <input
                  className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  value={voteForm.company}
                  onChange={(e) => setVoteForm({ ...voteForm, company: e.target.value })}
                  placeholder="e.g. Apple Inc."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Short Description (for the card)</label>
                <input
                  className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  value={voteForm.proposal}
                  onChange={(e) => setVoteForm({ ...voteForm, proposal: e.target.value })}
                  placeholder="e.g. Spin-off Cloud Division"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Detailed Summary</label>
                <textarea
                  className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-medium min-h-[120px]"
                  value={voteForm.summary}
                  onChange={(e) => setVoteForm({ ...voteForm, summary: e.target.value })}
                  placeholder="Explain the details of the proposal..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Resolve By Date</label>
                  <input
                    type="date"
                    className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                    value={voteForm.resolveBy}
                    onChange={(e) => setVoteForm({ ...voteForm, resolveBy: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all">
                  {editingVote ? 'Save Changes' : 'Publish Vote'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoteModalOpen(false)}
                  className="px-8 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-4xl font-black mb-2">Active Proxy Votes</h1>
                  <p className="text-slate-500 font-medium text-lg italic">Crowdsourced governance intelligence.</p>
                </div>

                {/* ONLY SHOW TO ADMIN */}
                {currentUser === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingVote(null);
                      setVoteForm({ company: "", proposal: "", summary: "", resolveBy: "" });
                      setIsVoteModalOpen(true);
                    }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    + Create New Vote
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {votes.map(vote => (
                  <div
                    key={vote.id}
                    onClick={() => {
                      // 1. If the vote is already finished, don't let anyone click it
                      if (vote.status === 'resolved') return;

                      // 2. If the logged-in user is 'admin', don't let them enter the staking screen
                      if (currentUser === 'admin') {
                        alert("Admins cannot stake predictions. Please use the 'Resolve' button to close the market.");
                        return;
                      }

                      // 3. Otherwise, open the staking screen for regular users
                      setSelectedVote(vote);
                      setView('submit');
                      setSuccess(false);
                      setRationale("");
                      setForecast(50); // Reset the slider to middle
                    }}
                    // This part changes the look of the card if it's resolved or if an admin is hovering
                    className={`relative p-8 rounded-[3rem] border transition-all ${vote.status === 'resolved'
                        ? 'bg-slate-50 border-slate-100 opacity-80 cursor-default'
                        : 'bg-white border-slate-200 hover:shadow-xl cursor-pointer'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {vote.company}
                        </h3>
                        {/* Changed vote.description to vote.proposal */}
                        <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mt-1">
                          {vote.proposal}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* ADMIN TOOLS */}
                        {currentUser === 'admin' && vote.status !== 'resolved' && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>

                            {/* 1. THE RESOLVE BUTTON */}
                            <button
                              onClick={() => {
                                setEditingVote(vote.id);
                                setVoteForm({ ...vote }); // This copies the vote data into our form
                                setIsResolutionModalOpen(true); // This "turns on" the popup window
                              }}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => {
                                setEditingVote(vote.id);
                                setVoteForm({
                                  company: vote.company,
                                  proposal: vote.proposal, // Changed key
                                  summary: vote.summary || "",
                                  resolveBy: vote.resolveBy || ""
                                });
                                setIsVoteModalOpen(true);
                              }}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-xl hover:border-indigo-100 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteVote(vote.id)}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 border border-slate-100 rounded-xl hover:border-red-100 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        <div className="text-right ml-4">
                          <span className="text-3xl font-black text-slate-900">{vote.currentProbability || 50}%</span>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Market View</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500 leading-relaxed max-w-2xl">{vote.summary || vote.proposal}</p>
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
                    {/* Changed wallet to currentUser */}
                    <span className="text-6xl font-black">{currentUser ? balance : '—'}</span>
                    <span className="text-indigo-200 font-black mb-2 uppercase text-[10px] tracking-[0.3em]">PRXY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] text-indigo-200 uppercase font-black mb-1 tracking-tighter">My Rank</p>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-300" />
                        <p className="text-xl font-bold">{currentUser ? '#42' : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] text-indigo-200 uppercase font-black mb-1 tracking-tighter">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                        <p className="text-xl font-bold">{currentUser ? '74%' : '—'}</p>
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
            <h1 className="text-4xl font-black tracking-tight">Predictions/Analysis Reports</h1>
            {myPredictions.length === 0 ? (
              <div className="text-center p-24 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
                <p className="font-bold text-lg">No reports found for @{currentUser}.</p>
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
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-4">Report Submitted</h2>
                <p className="text-slate-500 mb-8 font-medium">Your analysis has been staked and recorded.</p>
                <button
                  onClick={() => setView('history')}
                  className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all"
                >
                  View My Reports
                </button>
              </div>
            ) : (
              <form onSubmit={submitAnalysis} className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-sm space-y-12">
                {!currentUser && (
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4 items-center">
                    <User className="text-amber-500 w-8 h-8" />
                    <p className="text-amber-900 font-bold">Please Login to Stake</p>
                  </div>
                )}
                <h2 className="text-4xl font-black mb-2">{selectedVote.company}</h2>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                        Probability Assessment
                      </label>
                      <p className="text-xs font-bold text-slate-500">How likely is this proposal to pass?</p>
                    </div>
                    <div className="text-right">
                      {/* Note: using your 'forecast' variable here */}
                      <span className="text-6xl font-black text-indigo-600 tabular-nums">{forecast}%</span>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Confidence in "FOR"</p>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={forecast}
                    onChange={(e) => setForecast(e.target.value)}
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 mb-4"
                  />

                  <div className="flex justify-between px-2">
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900 leading-none">AGAINST</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">0% Pass Chance</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 leading-none">FOR</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">100% Pass Chance</p>
                    </div>
                  </div>
                </div>
                <textarea className="w-full border border-slate-200 p-8 rounded-[2.5rem] outline-none focus:border-indigo-500 transition-all text-lg leading-relaxed min-h-[200px]" value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Provide your thesis..." required />
                <button type="submit" disabled={isSubmitting || !currentUser} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-600 transition-all disabled:bg-slate-200 shadow-xl">
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