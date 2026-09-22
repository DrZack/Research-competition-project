import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Users, BookOpen, FileText, CheckCircle2, Clock, Save, Send, Plus, 
  Trash2, Edit3, Eye, EyeOff, Copy, Download, RefreshCw, LogOut, Lock, 
  Shield, Star, Search, Filter, BarChart3, ChevronRight, UserPlus, FolderPlus, 
  Sliders, X, Check, Share2, HelpCircle, Award, List, Grid, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase Configuration setup with graceful fallback to local state
const firebaseConfigRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'research-eval-app';

let db = null;
let auth = null;

if (firebaseConfigRaw) {
  try {
    const config = JSON.parse(firebaseConfigRaw);
    const app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn("Firebase initialization skipped or failed, using local memory state mode:", err);
  }
}

// Seed criteria for initial setup
const INITIAL_CRITERIA = [
  // Presentation Criteria
  { id: 'c1', title: 'Problem Definition & Clarity', maxScore: 10, description: 'Clearly articulated research question, objectives, and problem relevance.', setType: 'presentation' },
  { id: 'c2', title: 'Methodology & Rigor', maxScore: 15, description: 'Appropriate experimental design, data collection, and robust analytical tools.', setType: 'presentation' },
  { id: 'c3', title: 'Oral Presentation & Delivery', maxScore: 10, description: 'Clear speaking pace, effective storytelling, time management, and confidence.', setType: 'presentation' },
  { id: 'c4', title: 'Q&A Responsiveness', maxScore: 15, description: 'Demonstrates deep understanding when answering challenging judge questions.', setType: 'presentation' },
  
  // Poster Criteria
  { id: 'c5', title: 'Visual Organization & Layout', maxScore: 10, description: 'Logical flow, clear section headers, readable font size, and visual appeal.', setType: 'poster' },
  { id: 'c6', title: 'Data Visualization & Charts', maxScore: 15, description: 'Effective graphs, figures, and diagrams that convey complex data quickly.', setType: 'poster' },
  { id: 'c7', title: 'Originality & Significance', maxScore: 15, description: 'Novelty of research contribution and potential impact on the field.', setType: 'poster' },
  { id: 'c8', title: 'Key Conclusions & Future Work', maxScore: 10, description: 'Concise summary of findings and realistic next steps for research.', setType: 'poster' },
];

// Seed projects across 2 main rooms
const INITIAL_PROJECTS = [
  { id: 'p1', code: 'PRJ-101', title: 'Quantum Machine Learning for Protein Folding', room: 'Room A', category: 'Biomedical & AI', authors: 'Dr. Elena Rostova, Marcus Vance', abstract: 'Utilizing quantum variational algorithms to predict complex tertiary protein structures with 94% accuracy in reduced computational time.' },
  { id: 'p2', code: 'PRJ-102', title: 'Biodegradable Algae Nanocomposites for Packaging', room: 'Room A', category: 'Materials Science', authors: 'Sophia Chen, David Miller', abstract: 'Engineering macroalgae-derived cellulose nanofibers with plant polymers to create marine-degradable food containers.' },
  { id: 'p3', code: 'PRJ-103', title: 'Autonomous Micro-Grid Power Distribution', room: 'Room A', category: 'Electrical Eng.', authors: 'Liam O\'Connor, Priya Sharma', abstract: 'A decentralized peer-to-peer energy trading algorithm using smart contracts for remote solar micro-grids.' },
  { id: 'p4', code: 'PRJ-104', title: 'Deep Learning Diagnostics for Early Glaucoma Detection', room: 'Room B', category: 'Medical Imaging', authors: 'Ananya Patel, Lucas Meyer', abstract: 'Applying convolutional neural networks to non-mydriatic fundus photos for stage-1 glaucoma risk scoring.' },
  { id: 'p5', code: 'PRJ-105', title: 'Carbon Capture Optimization using MOF Catalysts', room: 'Room B', category: 'Chemical Eng.', authors: 'Jameson Thorne, Hannah Kim', abstract: 'Synthesizing novel metal-organic frameworks with high CO2 selectivity under ambient industrial exhaust temperatures.' },
  { id: 'p6', code: 'PRJ-106', title: 'Swarm Robotics for Disaster Search and Rescue', room: 'Room B', category: 'Robotics', authors: 'Aarav Gupta, Sarah Jenkins', abstract: 'Cooperative multi-agent search algorithms in mesh-networked micro-drones operating in GPS-denied environments.' },
];

// Seed judges with room assignments
const INITIAL_JUDGES = [
  { id: 'j1', name: 'Dr. Arthur Pendelton', affiliation: 'Institute for Advanced Robotics', room: 'Room A', username: 'judge_arthur', password: 'pass_arthur_2026' },
  { id: 'j2', name: 'Prof. Beatrice Vance', affiliation: 'Dept. of Bioengineering', room: 'Room A', username: 'judge_beatrice', password: 'pass_beatrice_2026' },
  { id: 'j3', name: 'Dr. Carlos Mendez', affiliation: 'Center for Materials Innovation', room: 'Room B', username: 'judge_carlos', password: 'pass_carlos_2026' },
  { id: 'j4', name: 'Dr. Diana Prince', affiliation: 'National Energy Laboratories', room: 'Room B', username: 'judge_diana', password: 'pass_diana_2026' },
];

// Seed evaluation status and scores
const INITIAL_EVALUATIONS = {
  'j1_p1': {
    judgeId: 'j1', projectId: 'p1', status: 'submitted',
    scores: { c1: 9, c2: 14, c3: 9, c4: 13, c5: 9, c6: 14, c7: 14, c8: 9 },
    feedback: 'Outstanding presentation. Clear methodology and convincing quantum algorithmic formulation.',
    updatedAt: '2026-09-21 10:15'
  },
  'j1_p2': {
    judgeId: 'j1', projectId: 'p2', status: 'draft',
    scores: { c1: 8, c2: 12, c3: 8, c4: 11, c5: 8, c6: 12, c7: 12, c8: 8 },
    feedback: 'Great initial presentation, waiting to review final poster visuals.',
    updatedAt: '2026-09-21 11:00'
  },
  'j3_p4': {
    judgeId: 'j3', projectId: 'p4', status: 'submitted',
    scores: { c1: 10, c2: 15, c3: 10, c4: 14, c5: 10, c6: 15, c7: 15, c8: 10 },
    feedback: 'Flawless diagnostic accuracy evaluation with clean visual representations.',
    updatedAt: '2026-09-21 11:30'
  }
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null); // { role: 'admin' | 'judge', name: string, ... }
  const [loginRole, setLoginRole] = useState('judge'); // 'judge' or 'admin'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Core Data State
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [judges, setJudges] = useState(INITIAL_JUDGES);
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS);

  // Admin View Navigation
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'projects', 'judges', 'rubrics', 'matrix', 'leaderboard', 'collaborators'
  const [roomFilter, setRoomFilter] = useState('All');

  // Judge Evaluation Modal / Selection State
  const [selectedProject, setSelectedProject] = useState(null);
  const [evalScores, setEvalScores] = useState({});
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalTab, setEvalTab] = useState('presentation'); // 'presentation' or 'poster'

  // Modals for Admin CRUD Operations
  const [projectModal, setProjectModal] = useState({ open: false, isEdit: false, data: null });
  const [judgeModal, setJudgeModal] = useState({ open: false, isEdit: false, data: null });
  const [criteriaModal, setCriteriaModal] = useState({ open: false, isEdit: false, data: null });
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Toast Notification State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Authenticate anonymously if Firestore is active
    if (auth && db) {
      signInAnonymously(auth).catch(err => console.log("Anonymous auth error:", err));
      
      // Setup Firestore listeners for real-time collaboration
      const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
      const unsubProjects = onSnapshot(projectsRef, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          setProjects(list);
        }
      }, (err) => console.log("Projects snapshot error", err));

      const judgesRef = collection(db, 'artifacts', appId, 'public', 'data', 'judges');
      const unsubJudges = onSnapshot(judgesRef, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          setJudges(list);
        }
      }, (err) => console.log("Judges snapshot error", err));

      const criteriaRef = collection(db, 'artifacts', appId, 'public', 'data', 'criteria');
      const unsubCriteria = onSnapshot(criteriaRef, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          setCriteria(list);
        }
      }, (err) => console.log("Criteria snapshot error", err));

      const evalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'evaluations');
      const unsubEvals = onSnapshot(evalsRef, (snapshot) => {
        if (!snapshot.empty) {
          const evalMap = {};
          snapshot.forEach(doc => {
            evalMap[doc.id] = doc.data();
          });
          setEvaluations(evalMap);
        }
      }, (err) => console.log("Evals snapshot error", err));

      return () => {
        unsubProjects();
        unsubJudges();
        unsubCriteria();
        unsubEvals();
      };
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginRole === 'admin') {
      if (loginUsername.trim() === 'admin' && loginPassword.trim() === 'admin2026') {
        setCurrentUser({ role: 'admin', name: 'System Administrator' });
        showToast('Welcome, System Administrator!');
      } else {
        setLoginError('Invalid Admin credentials. (Default: admin / admin2026)');
      }
    } else {
      // Judge Authentication
      const foundJudge = judges.find(
        j => j.username.trim() === loginUsername.trim() && j.password.trim() === loginPassword.trim()
      );
      if (foundJudge) {
        setCurrentUser({ role: 'judge', ...foundJudge });
        showToast(`Welcome back, ${foundJudge.name}`);
      } else {
        setLoginError('Invalid Username or Password. Please check credentials issued by competition admin.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setSelectedProject(null);
    showToast('Logged out successfully.');
  };

  const syncSaveItem = async (collectionName, itemId, dataObj) => {
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, itemId), dataObj);
      } catch (e) {
        console.error("Firestore sync error:", e);
      }
    }
  };

  const syncDeleteItem = async (collectionName, itemId) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, itemId));
      } catch (e) {
        console.error("Firestore delete error:", e);
      }
    }
  };

  const presentationMaxScore = useMemo(() => {
    return criteria.filter(c => c.setType === 'presentation').reduce((acc, curr) => acc + Number(curr.maxScore), 0);
  }, [criteria]);

  const posterMaxScore = useMemo(() => {
    return criteria.filter(c => c.setType === 'poster').reduce((acc, curr) => acc + Number(curr.maxScore), 0);
  }, [criteria]);

  const totalPossibleScore = presentationMaxScore + posterMaxScore;

  // Compute calculated metrics for all projects
  const projectMetrics = useMemo(() => {
    return projects.map(project => {
      // Get all evaluations for this project
      const projectEvals = Object.values(evaluations).filter(e => e.projectId === project.id && e.status === 'submitted');
      const evalCount = projectEvals.length;

      if (evalCount === 0) {
        return {
          ...project,
          evalCount: 0,
          avgPresentationScore: 0,
          avgPosterScore: 0,
          avgTotalScore: 0,
          presentationPct: 0,
          posterPct: 0,
          overallPct: 0
        };
      }

      let totalPres = 0;
      let totalPost = 0;

      projectEvals.forEach(ev => {
        criteria.forEach(crit => {
          const score = Number(ev.scores?.[crit.id] || 0);
          if (crit.setType === 'presentation') totalPres += score;
          if (crit.setType === 'poster') totalPost += score;
        });
      });

      const avgPres = totalPres / evalCount;
      const avgPost = totalPost / evalCount;
      const avgTotal = avgPres + avgPost;

      const presPct = presentationMaxScore > 0 ? (avgPres / presentationMaxScore) * 100 : 0;
      const postPct = posterMaxScore > 0 ? (avgPost / posterMaxScore) * 100 : 0;
      const overPct = totalPossibleScore > 0 ? (avgTotal / totalPossibleScore) * 100 : 0;

      return {
        ...project,
        evalCount,
        avgPresentationScore: avgPres,
        avgPosterScore: avgPost,
        avgTotalScore: avgTotal,
        presentationPct: presPct,
        posterPct: postPct,
        overallPct: overPct
      };
    });
  }, [projects, evaluations, criteria, presentationMaxScore, posterMaxScore, totalPossibleScore]);

  // Ranked Projects
  const leaderboardProjects = useMemo(() => {
    let filtered = [...projectMetrics];
    if (roomFilter !== 'All') {
      filtered = filtered.filter(p => p.room === roomFilter);
    }
    return filtered.sort((a, b) => b.overallPct - a.overallPct);
  }, [projectMetrics, roomFilter]);

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const projData = {
      id: projectModal.isEdit ? projectModal.data.id : `p_${Date.now()}`,
      code: formData.get('code'),
      title: formData.get('title'),
      room: formData.get('room'),
      category: formData.get('category'),
      authors: formData.get('authors'),
      abstract: formData.get('abstract'),
    };

    if (projectModal.isEdit) {
      setProjects(prev => prev.map(p => p.id === projData.id ? projData : p));
      showToast('Project updated successfully!');
    } else {
      setProjects(prev => [...prev, projData]);
      showToast('New project created!');
    }

    await syncSaveItem('projects', projData.id, projData);
    setProjectModal({ open: false, isEdit: false, data: null });
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      await syncDeleteItem('projects', id);
      showToast('Project deleted', 'info');
    }
  };

  const handleSaveJudge = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const judgeData = {
      id: judgeModal.isEdit ? judgeModal.data.id : `j_${Date.now()}`,
      name: formData.get('name'),
      affiliation: formData.get('affiliation'),
      room: formData.get('room'),
      username: formData.get('username'),
      password: formData.get('password'),
    };

    if (judgeModal.isEdit) {
      setJudges(prev => prev.map(j => j.id === judgeData.id ? judgeData : j));
      showToast('Judge updated successfully!');
    } else {
      setJudges(prev => [...prev, judgeData]);
      showToast('New Judge added successfully!');
    }

    await syncSaveItem('judges', judgeData.id, judgeData);
    setJudgeModal({ open: false, isEdit: false, data: null });
  };

  const handleDeleteJudge = async (id) => {
    if (window.confirm("Are you sure you want to delete this judge account?")) {
      setJudges(prev => prev.filter(j => j.id !== id));
      await syncDeleteItem('judges', id);
      showToast('Judge account removed', 'info');
    }
  };

  const handleSaveCriteria = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const critData = {
      id: criteriaModal.isEdit ? criteriaModal.data.id : `c_${Date.now()}`,
      title: formData.get('title'),
      maxScore: Number(formData.get('maxScore')),
      description: formData.get('description'),
      setType: formData.get('setType'),
    };

    if (criteriaModal.isEdit) {
      setCriteria(prev => prev.map(c => c.id === critData.id ? critData : c));
      showToast('Criteria item updated!');
    } else {
      setCriteria(prev => [...prev, critData]);
      showToast('New Criteria item added!');
    }

    await syncSaveItem('criteria', critData.id, critData);
    setCriteriaModal({ open: false, isEdit: false, data: null });
  };

  const handleDeleteCriteria = async (id) => {
    if (window.confirm("Are you sure you want to delete this criteria item?")) {
      setCriteria(prev => prev.filter(c => c.id !== id));
      await syncDeleteItem('criteria', id);
      showToast('Criteria item removed', 'info');
    }
  };

  const openProjectEvaluation = (project) => {
    setSelectedProject(project);
    const key = `${currentUser.id}_${project.id}`;
    const existingEval = evaluations[key];

    if (existingEval) {
      setEvalScores({ ...existingEval.scores });
      setEvalFeedback(existingEval.feedback || '');
    } else {
      // Default initial scores
      const initialMap = {};
      criteria.forEach(c => { initialMap[c.id] = 0; });
      setEvalScores(initialMap);
      setEvalFeedback('');
    }
  };

  const handleScoreChange = (critId, val, maxVal) => {
    let numVal = Math.min(Math.max(0, Number(val) || 0), maxVal);
    setEvalScores(prev => ({ ...prev, [critId]: numVal }));
  };

  const handleSaveEvaluation = async (status) => {
    if (!selectedProject || !currentUser) return;
    const key = `${currentUser.id}_${selectedProject.id}`;
    const evalObj = {
      judgeId: currentUser.id,
      projectId: selectedProject.id,
      status, // 'draft' or 'submitted'
      scores: evalScores,
      feedback: evalFeedback,
      updatedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };

    const newEvals = { ...evaluations, [key]: evalObj };
    setEvaluations(newEvals);
    await syncSaveItem('evaluations', key, evalObj);

    showToast(status === 'submitted' ? 'Evaluation Submitted Successfully!' : 'Evaluation Draft Saved!', status === 'submitted' ? 'success' : 'info');
    setSelectedProject(null);
  };

  const handleLoadDemoData = async () => {
    if (window.confirm("This will reload sample projects, judges, rubrics, and evaluations. Continue?")) {
      setProjects(INITIAL_PROJECTS);
      setJudges(INITIAL_JUDGES);
      setCriteria(INITIAL_CRITERIA);
      setEvaluations(INITIAL_EVALUATIONS);

      if (db) {
        INITIAL_PROJECTS.forEach(p => syncSaveItem('projects', p.id, p));
        INITIAL_JUDGES.forEach(j => syncSaveItem('judges', j.id, j));
        INITIAL_CRITERIA.forEach(c => syncSaveItem('criteria', c.id, c));
        Object.entries(INITIAL_EVALUATIONS).forEach(([k, v]) => syncSaveItem('evaluations', k, v));
      }
      showToast('Demo data loaded successfully!');
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Project Code,Title,Room,Category,Authors,Evaluations Count,Presentation Score (Avg),Poster Score (Avg),Total Score (Avg),Overall Percentage\n";

    leaderboardProjects.forEach((p, idx) => {
      const row = [
        idx + 1,
        `"${p.code}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.room}"`,
        `"${p.category}"`,
        `"${p.authors}"`,
        p.evalCount,
        p.avgPresentationScore.toFixed(2),
        p.avgPosterScore.toFixed(2),
        p.avgTotalScore.toFixed(2),
        `${p.overallPct.toFixed(1)}%`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Research_Competition_Results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported ranking CSV file!');
  };

  // Rooms list
  const roomsList = useMemo(() => {
    const setR = new Set(projects.map(p => p.room));
    return ['All', ...Array.from(setR)];
  }, [projects]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100/50 to-sky-50 text-slate-800 flex flex-col justify-between font-sans">
        {/* Top Header */}
        <header className="p-6 flex items-center justify-between border-b border-sky-200/60 bg-white/70 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-600 rounded-xl text-white shadow-md shadow-sky-200">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">EvalSphere</h1>
              <p className="text-xs text-sky-600 font-medium">Research Competition Evaluation & Ranking System</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium px-3 py-1.5 bg-sky-100/60 rounded-full border border-sky-200">
            2026 Academic Edition
          </div>
        </header>

        {/* Center Login Container */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-200/50 border border-sky-100 overflow-hidden">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-500 p-6 text-white text-center">
              <h2 className="text-2xl font-bold tracking-tight">Portal Access</h2>
              <p className="text-sky-100 text-xs mt-1">Sign in with credentials assigned by competition organizers</p>
            </div>

            {/* Login Role Toggle Tabs */}
            <div className="flex border-b border-sky-100 bg-sky-50/50">
              <button
                type="button"
                onClick={() => { setLoginRole('judge'); setLoginError(''); }}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  loginRole === 'judge' 
                    ? 'bg-white text-sky-700 border-b-2 border-sky-600' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Judge Portal
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('admin'); setLoginError(''); }}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  loginRole === 'admin' 
                    ? 'bg-white text-sky-700 border-b-2 border-sky-600' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Portal
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {loginRole === 'admin' ? 'Admin Username' : 'Judge Username'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={loginRole === 'admin' ? 'e.g. admin' : 'Enter assigned username'}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm bg-sky-50/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm bg-sky-50/30"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                {loginRole === 'judge' 
                  ? 'Judges must use credentials provided by competition staff.' 
                  : 'System Administrator access only.'}
              </p>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-xs text-slate-500 border-t border-sky-200/50 bg-white/40">
          Research Competition Evaluation & Ranking Platform &bull; Clean Light Blue Theme
        </footer>
      </div>
    );
  }

  const ToastBanner = () => toast && (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all ${
      toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-sky-50 border-sky-200 text-sky-800'
    }`}>
      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );

  if (currentUser.role === 'judge') {
    const assignedRoomProjects = projects.filter(
      p => currentUser.room === 'All' || p.room === currentUser.room
    );

    return (
      <div className="min-h-screen bg-sky-50/60 text-slate-800 font-sans flex flex-col">
        <ToastBanner />

        {/* Judge Top Navigation */}
        <header className="bg-white border-b border-sky-100 shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-600 text-white rounded-lg shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-slate-900 leading-tight">EvalSphere Judge Workspace</h1>
                <p className="text-xs text-sky-600 font-medium">Assigned Room: <span className="font-semibold text-slate-700">{currentUser.room}</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-800">{currentUser.name}</div>
                <div className="text-xs text-slate-500">{currentUser.affiliation}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Judge Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-500 rounded-2xl p-6 text-white shadow-md shadow-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-sky-400/30 text-white text-xs font-bold uppercase rounded-full tracking-wide">
                Judge Workspace
              </span>
              <h2 className="text-2xl font-bold mt-2">Welcome, {currentUser.name}</h2>
              <p className="text-sky-100 text-sm mt-1">
                You are assigned to evaluate projects in <span className="underline font-semibold">{currentUser.room}</span>. Select a project card below to grade presentation and poster rubrics.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center min-w-[140px]">
              <div className="text-2xl font-bold">{assignedRoomProjects.length}</div>
              <div className="text-xs text-sky-100">Assigned Projects</div>
            </div>
          </div>

          {/* Assigned Projects Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Projects for Evaluation ({currentUser.room})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedRoomProjects.map((project) => {
                const evalKey = `${currentUser.id}_${project.id}`;
                const evalItem = evaluations[evalKey];
                const status = evalItem ? evalItem.status : 'not_started';

                // Status Badge styling
                let statusBadge = (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Not Started
                  </span>
                );
                if (status === 'draft') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Save className="w-3 h-3" /> Draft Saved
                    </span>
                  );
                } else if (status === 'submitted') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Submitted
                    </span>
                  );
                }

                return (
                  <div key={project.id} className="bg-white rounded-xl border border-sky-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-md border border-sky-100">
                          {project.code}
                        </span>
                        {statusBadge}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                        {project.title}
                      </h4>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div><strong className="text-slate-700">Category:</strong> {project.category}</div>
                        <div><strong className="text-slate-700">Authors:</strong> {project.authors}</div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 bg-sky-50/40 p-2.5 rounded-lg border border-sky-100/50 italic">
                        "{project.abstract}"
                      </p>
                    </div>

                    <div className="px-5 py-3.5 bg-sky-50/50 border-t border-sky-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {status === 'submitted' ? 'Evaluation complete' : 'Ready for scoring'}
                      </span>
                      <button
                        onClick={() => openProjectEvaluation(project)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                          status === 'submitted'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                            : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {status === 'submitted' ? 'Review / Edit Scores' : 'Evaluate Project'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Evaluation Grading Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-sky-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-start justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-sky-600 text-white text-xs font-bold rounded">
                      {selectedProject.code}
                    </span>
                    <span className="text-xs text-slate-300">{selectedProject.room}</span>
                  </div>
                  <h3 className="text-lg font-bold">{selectedProject.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Authors: {selectedProject.authors}</p>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-sky-100 bg-sky-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setEvalTab('presentation')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 ${
                    evalTab === 'presentation'
                      ? 'border-sky-600 bg-white text-sky-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Presentation Criteria ({criteria.filter(c => c.setType === 'presentation').length})
                </button>
                <button
                  type="button"
                  onClick={() => setEvalTab('poster')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 ${
                    evalTab === 'poster'
                      ? 'border-sky-600 bg-white text-sky-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Poster Criteria ({criteria.filter(c => c.setType === 'poster').length})
                </button>
              </div>

              {/* Modal Scoring Area */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                <div className="space-y-4">
                  {criteria
                    .filter(c => c.setType === evalTab)
                    .map((item) => {
                      const currentScore = evalScores[item.id] || 0;
                      return (
                        <div key={item.id} className="p-4 rounded-xl bg-sky-50/30 border border-sky-100 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-bold text-sky-700">{currentScore}</span>
                              <span className="text-xs text-slate-400"> / {item.maxScore} pts</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={item.maxScore}
                              step="1"
                              value={currentScore}
                              onChange={(e) => handleScoreChange(item.id, e.target.value, item.maxScore)}
                              className="w-full accent-sky-600 h-2 bg-sky-100 rounded-lg cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              value={currentScore}
                              onChange={(e) => handleScoreChange(item.id, e.target.value, item.maxScore)}
                              className="w-16 px-2 py-1 text-center font-semibold text-sm border border-sky-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Feedback Comment Box */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judge Qualitative Feedback / Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback for research authors..."
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    className="w-full p-3 text-sm border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-sky-50/20"
                  />
                </div>
              </div>

              {/* Modal Footer Score Summary */}
              <div className="p-4 bg-sky-50 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-600">
                  Total Score Calculated:{' '}
                  <span className="font-bold text-slate-900 text-base">
                    {Object.values(evalScores).reduce((a, b) => Number(a) + Number(b), 0)}
                  </span>{' '}
                  / {totalPossibleScore} pts
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation('draft')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-600" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation('submitted')}
                    className="flex-1 sm:flex-none px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-md shadow-sky-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Final Submit
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50/50 text-slate-800 font-sans flex flex-col">
      <ToastBanner />

      {/* Admin Header */}
      <header className="bg-white border-b border-sky-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md shadow-sky-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">EvalSphere Admin Portal</h1>
              <p className="text-xs text-sky-600 font-medium">Competition Organizer Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLoadDemoData}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Load Demo Data
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto border-t border-sky-100/60 pt-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'leaderboard', label: 'Live Leaderboard', icon: Trophy },
            { id: 'matrix', label: '15x Matrix', icon: Grid },
            { id: 'projects', label: 'Manage Projects', icon: BookOpen },
            { id: 'judges', label: 'Manage Judges', icon: Users },
            { id: 'rubrics', label: 'Manage Rubrics', icon: Sliders },
            { id: 'collaborators', label: 'Collaborator Guide', icon: UserPlus },
          ].map(tab => {
            const Icon = tab.icon;
            const active = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`py-2.5 px-3.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
                  active 
                    ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-sky-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* OVERVIEW TAB */}
        {adminTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Total Projects</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</div>
                </div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Registered Judges</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{judges.length}</div>
                </div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Evaluation Rubrics</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{criteria.length} Criteria</div>
                </div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                  <Sliders className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Submitted Scores</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {Object.values(evaluations).filter(e => e.status === 'submitted').length}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard snippet */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Top Performing Projects
                  </h3>
                  <button onClick={() => setAdminTab('leaderboard')} className="text-xs font-semibold text-sky-600 hover:underline">
                    View Full Rankings &rarr;
                  </button>
                </div>

                <div className="divide-y divide-sky-100">
                  {leaderboardProjects.slice(0, 5).map((p, index) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                          index === 0 ? 'bg-amber-100 text-amber-800' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          index === 2 ? 'bg-amber-700/20 text-amber-900' : 'bg-sky-50 text-slate-600'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-slate-900 line-clamp-1">{p.title}</div>
                          <div className="text-xs text-slate-500">{p.code} &bull; {p.room}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-sky-700">{p.overallPct.toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">{p.evalCount} evals</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions Panel */}
              <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  Quick Controls
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => setProjectModal({ open: true, isEdit: false, data: null })}
                    className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add New Project
                  </button>
                  <button
                    onClick={() => setJudgeModal({ open: true, isEdit: false, data: null })}
                    className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Add New Judge Account
                  </button>
                  <button
                    onClick={() => setCriteriaModal({ open: true, isEdit: false, data: null })}
                    className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200 flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4" /> Add Rubric Criteria
                  </button>
                </div>

                <div className="pt-4 border-t border-sky-100">
                  <p className="text-xs text-slate-500">
                    Use full management tabs to edit or delete projects, judges, and rubrics as needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {adminTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  Live Research Competition Leaderboard
                </h3>
                <p className="text-xs text-slate-500 mt-1">Calculates average scores submitted by assigned judges</p>
              </div>

              {/* Room Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Room:</span>
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-sky-200 rounded-lg bg-sky-50/50 text-slate-800 focus:outline-none"
                >
                  {roomsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto border border-sky-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-sky-100">
                    <th className="p-3.5 text-center">Rank</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Project Title</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5 text-center">Evals</th>
                    <th className="p-3.5 text-right">Presentation</th>
                    <th className="p-3.5 text-right">Poster</th>
                    <th className="p-3.5 text-right">Overall Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-sm">
                  {leaderboardProjects.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400 text-slate-900 shadow-sm' :
                          idx === 1 ? 'bg-slate-300 text-slate-800' :
                          idx === 2 ? 'bg-amber-600 text-white' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-sky-700">{p.code}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="text-xs text-slate-400">{p.authors}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-xs font-semibold rounded">
                          {p.room}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-xs text-slate-600">{p.evalCount}</td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {p.avgPresentationScore.toFixed(1)} / {presentationMaxScore}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {p.avgPosterScore.toFixed(1)} / {posterMaxScore}
                      </td>
                      <td className="p-3.5 text-right font-bold text-sky-700">
                        {p.overallPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {adminTab === 'matrix' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-6 h-6 text-sky-600" />
                Projects x Judges Submission Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-1">Real-time status of judge evaluations across all projects</p>
            </div>

            <div className="overflow-x-auto border border-sky-100 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-sky-50 text-slate-700 text-xs font-bold uppercase border-b border-sky-100">
                    <th className="p-3.5">Project Code & Title</th>
                    <th className="p-3.5">Room</th>
                    {judges.map(j => (
                      <th key={j.id} className="p-3.5 text-center">
                        <div>{j.name.split(' ')[1] || j.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{j.room}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-xs">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-sky-50/20">
                      <td className="p-3.5">
                        <span className="font-bold text-sky-700 mr-2">{p.code}</span>
                        <span className="font-medium text-slate-800">{p.title}</span>
                      </td>
                      <td className="p-3.5 text-slate-500">{p.room}</td>
                      {judges.map(j => {
                        const evalKey = `${j.id}_${p.id}`;
                        const evalItem = evaluations[evalKey];
                        const status = evalItem ? evalItem.status : 'none';

                        return (
                          <td key={j.id} className="p-3.5 text-center">
                            {status === 'submitted' && (
                              <span className="inline-block p-1.5 bg-emerald-100 text-emerald-800 rounded-full" title="Submitted">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            )}
                            {status === 'draft' && (
                              <span className="inline-block p-1.5 bg-amber-100 text-amber-800 rounded-full" title="Draft Saved">
                                <Clock className="w-4 h-4" />
                              </span>
                            )}
                            {status === 'none' && (
                              <span className="inline-block w-2.5 h-2.5 bg-slate-200 rounded-full" title="Not Started" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-amber-100 text-amber-800 rounded-full"><Clock className="w-3.5 h-3.5" /></span>
                <span>Draft Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                <span>Not Started</span>
              </div>
            </div>
          </div>
        )}

        {}
        {adminTab === 'projects' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-sky-600" />
                  Project Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">Create, edit, or remove competition projects manually</p>
              </div>

              <button
                onClick={() => setProjectModal({ open: true, isEdit: false, data: null })}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-200 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p.id} className="p-4 rounded-xl border border-sky-100 bg-sky-50/20 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 font-bold text-xs rounded">{p.code}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-sky-100">{p.room}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{p.title}</h4>
                    <p className="text-xs text-slate-500 mt-1"><strong>Authors:</strong> {p.authors}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.abstract}</p>
                  </div>

                  <div className="pt-3 border-t border-sky-100 flex justify-end space-x-2">
                    <button
                      onClick={() => setProjectModal({ open: true, isEdit: true, data: p })}
                      className="px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 rounded border border-sky-200 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {adminTab === 'judges' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-sky-600" />
                  Judge Account Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Issue unique usernames and passwords to judges. No judge credentials appear publicly.
                </p>
              </div>

              <button
                onClick={() => setJudgeModal({ open: true, isEdit: false, data: null })}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-200 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Add Judge
              </button>
            </div>

            <div className="overflow-x-auto border border-sky-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sky-50 text-slate-700 font-bold uppercase border-b border-sky-100">
                    <th className="p-3.5">Judge Name</th>
                    <th className="p-3.5">Affiliation</th>
                    <th className="p-3.5">Assigned Room</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Password</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-800">
                  {judges.map(j => {
                    const showPass = showPasswordMap[j.id];
                    return (
                      <tr key={j.id} className="hover:bg-sky-50/30">
                        <td className="p-3.5 font-bold text-slate-900">{j.name}</td>
                        <td className="p-3.5 text-slate-600">{j.affiliation}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-semibold rounded">
                            {j.room}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-sky-700">{j.username}</td>
                        <td className="p-3.5 font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{showPass ? j.password : '••••••••'}</span>
                            <button
                              onClick={() => setShowPasswordMap(prev => ({ ...prev, [j.id]: !prev[j.id] }))}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setJudgeModal({ open: true, isEdit: true, data: j })}
                            className="px-2 py-1 text-sky-700 hover:bg-sky-100 rounded border border-sky-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJudge(j.id)}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {adminTab === 'rubrics' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-sky-600" />
                  Rubric & Evaluation Criteria Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure scoring criteria for Presentation and Poster rounds</p>
              </div>

              <button
                onClick={() => setCriteriaModal({ open: true, isEdit: false, data: null })}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-200 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Criteria
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Presentation Set */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-sky-100">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    Presentation Criteria Set
                  </span>
                  <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    Max: {presentationMaxScore} pts
                  </span>
                </h4>

                <div className="space-y-3">
                  {criteria.filter(c => c.setType === 'presentation').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/20 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{c.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                        <span className="inline-block mt-2 text-xs font-bold text-sky-700">Max Points: {c.maxScore}</span>
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        <button onClick={() => setCriteriaModal({ open: true, isEdit: true, data: c })} className="p-1 text-sky-700 hover:bg-sky-100 rounded">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCriteria(c.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Poster Set */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-sky-100">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    Poster Criteria Set
                  </span>
                  <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    Max: {posterMaxScore} pts
                  </span>
                </h4>

                <div className="space-y-3">
                  {criteria.filter(c => c.setType === 'poster').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/20 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{c.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                        <span className="inline-block mt-2 text-xs font-bold text-sky-700">Max Points: {c.maxScore}</span>
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        <button onClick={() => setCriteriaModal({ open: true, isEdit: true, data: c })} className="p-1 text-sky-700 hover:bg-sky-100 rounded">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCriteria(c.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {adminTab === 'collaborators' && (
          <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-sky-600" />
                Collaborator & Team Coordination Guidelines
              </h3>
              <p className="text-xs text-slate-500 mt-1">Instructions for coordinating with co-organizers, judges, and authors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/30 space-y-3">
                <div className="p-2.5 bg-sky-600 text-white rounded-xl w-fit">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Co-Organizers</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide co-organizers with the fixed Admin credentials (<span className="font-mono font-bold text-sky-700">admin / admin2026</span>) to collaboratively edit rubrics, upload projects, and monitor live evaluations in real-time.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/30 space-y-3">
                <div className="p-2.5 bg-sky-600 text-white rounded-xl w-fit">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Assigned Judges</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In the <strong className="text-slate-800">Manage Judges</strong> tab, assign judges to specific rooms (e.g., Room A). Copy and issue their private username and password directly.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/30 space-y-3">
                <div className="p-2.5 bg-sky-600 text-white rounded-xl w-fit">
                  <Trophy className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Authors & Attendees</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  At the conclusion of judging, use the <strong className="text-slate-800">Export CSV</strong> button to generate complete final rankings for presentation awards and official certificates.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {}
      
      {/* Project Modal */}
      {projectModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 w-full max-w-lg overflow-hidden">
            <div className="bg-sky-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {projectModal.isEdit ? 'Edit Project Details' : 'Add New Project'}
              </h3>
              <button onClick={() => setProjectModal({ open: false, isEdit: false, data: null })} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Project Code</label>
                <input
                  name="code"
                  defaultValue={projectModal.data?.code || `PRJ-${Math.floor(100 + Math.random() * 900)}`}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Title</label>
                <input
                  name="title"
                  defaultValue={projectModal.data?.title || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Room / Location</label>
                  <input
                    name="room"
                    defaultValue={projectModal.data?.room || 'Room A'}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    name="category"
                    defaultValue={projectModal.data?.category || 'General Science'}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Authors</label>
                <input
                  name="authors"
                  defaultValue={projectModal.data?.authors || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Abstract Summary</label>
                <textarea
                  name="abstract"
                  rows={3}
                  defaultValue={projectModal.data?.abstract || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setProjectModal({ open: false, isEdit: false, data: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Judge Modal */}
      {judgeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 w-full max-w-lg overflow-hidden">
            <div className="bg-sky-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {judgeModal.isEdit ? 'Edit Judge Credentials' : 'Add New Judge'}
              </h3>
              <button onClick={() => setJudgeModal({ open: false, isEdit: false, data: null })} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJudge} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  name="name"
                  defaultValue={judgeModal.data?.name || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Affiliation / Inst.</label>
                  <input
                    name="affiliation"
                    defaultValue={judgeModal.data?.affiliation || ''}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Assigned Room</label>
                  <input
                    name="room"
                    defaultValue={judgeModal.data?.room || 'Room A'}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Assigned Username</label>
                  <input
                    name="username"
                    defaultValue={judgeModal.data?.username || `judge_${Math.floor(100 + Math.random() * 900)}`}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Password</label>
                  <input
                    name="password"
                    defaultValue={judgeModal.data?.password || `pass_${Math.floor(1000 + Math.random() * 9000)}`}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setJudgeModal({ open: false, isEdit: false, data: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Save Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Criteria Modal */}
      {criteriaModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 w-full max-w-lg overflow-hidden">
            <div className="bg-sky-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {criteriaModal.isEdit ? 'Edit Rubric Criteria' : 'Add Rubric Criteria'}
              </h3>
              <button onClick={() => setCriteriaModal({ open: false, isEdit: false, data: null })} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriteria} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Criteria Title</label>
                <input
                  name="title"
                  defaultValue={criteriaModal.data?.title || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Criteria Set Type</label>
                  <select
                    name="setType"
                    defaultValue={criteriaModal.data?.setType || 'presentation'}
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="presentation">Presentation Round</option>
                    <option value="poster">Poster Round</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Max Score Points</label>
                  <input
                    type="number"
                    name="maxScore"
                    min="1"
                    max="100"
                    defaultValue={criteriaModal.data?.maxScore || 10}
                    required
                    className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Description / Guidance</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={criteriaModal.data?.description || ''}
                  required
                  className="w-full p-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCriteriaModal({ open: false, isEdit: false, data: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Save Criteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-sky-200/50 bg-white/40">
        EvalSphere Research Competition Management Platform &bull; Light Blue Theme
      </footer>
    </div>
  );
}