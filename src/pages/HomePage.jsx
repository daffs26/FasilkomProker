import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { Plus, Calendar, MapPin, Users, LogOut, Trash, ArrowRight, LayoutGrid, Search, Activity, Clock, TrendingUp, Sparkles, UserPlus, FolderKanban, ClipboardCheck, FileText, ExternalLink, FolderOpen, Sun, Moon, X } from 'lucide-react';
import LogoBEM from '../assets/logo-bem.png';


const MOCK_BEM_USERS = [
  { id: 'mock_user_1', name: 'Zian Farras', divisi: 'PSDM', jabatan: 'Kadep PSDM', email: 'zian@bem.umb.ac.id' },
  { id: 'mock_user_2', name: 'Siti Rahma', divisi: 'BPH', jabatan: 'Sekretaris 1', email: 'rahma@bem.umb.ac.id' },
  { id: 'mock_user_3', name: 'Ahmad Fauzi', divisi: 'BPH', jabatan: 'Bendahara 1', email: 'fauzi@bem.umb.ac.id' },
  { id: 'mock_user_4', name: 'Rian Hidayat', divisi: 'PSDM', jabatan: 'Kadiv PSDM Pengembangan', email: 'rian@bem.umb.ac.id' },
  { id: 'mock_user_5', name: 'Fajar Pratama', divisi: 'MINAT BAKAT', jabatan: 'Kadep Minat Bakat', email: 'fajar@bem.umb.ac.id' },
  { id: 'mock_user_6', name: 'Nabila Putri', divisi: 'SOSMAS', jabatan: 'Kadep Sosmas', email: 'nabila@bem.umb.ac.id' },
  { id: 'mock_user_7', name: 'Dimas Saputra', divisi: 'PDD', jabatan: 'Kadep PDD', email: 'dimas@bem.umb.ac.id' },
  { id: 'mock_user_8', name: 'Siti Aminah', divisi: 'SOSMAS', jabatan: 'Anggota Sosmas', email: 'aminah@bem.umb.ac.id' },
  { id: 'mock_user_9', name: 'Lutfi Hakim', divisi: 'ADVOKASI', jabatan: 'Kadep Advokasi', email: 'lutfi@bem.umb.ac.id' },
  { id: 'mock_user_10', name: 'Aulia Rahman', divisi: 'KOMINFO', jabatan: 'Kadep Kominfo', email: 'aulia@bem.umb.ac.id' },
  { id: 'mock_user_11', name: 'Fikri Hidayat', divisi: 'KOMINFO', jabatan: 'Anggota Kominfo', email: 'fikri@bem.umb.ac.id' },
  { id: 'mock_user_12', name: 'Putri Salsa', divisi: 'PDD', jabatan: 'Anggota PDD', email: 'putri@bem.umb.ac.id' },
  { id: 'mock_user_13', name: 'Aditya Pratama', divisi: 'ADVOKASI', jabatan: 'Anggota Advokasi', email: 'aditya@bem.umb.ac.id' },
];

export default function HomePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [prokers, setProkers] = useState([]);
  const [loadingProkers, setLoadingProkers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Theme states
  const [theme, setTheme] = useState(localStorage.getItem('FasilkomProker-theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('FasilkomProker-theme', nextTheme);
  };

  // Stats and lists states
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activitiesList, setActivitiesList] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activeTab, setActiveTab] = useState('proker');
  const [searchQuery, setSearchQuery] = useState('');

  // Global BEM Drive states
  const [globalDocsList, setGlobalDocsList] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState('Semua');
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Global Document Form State
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Template Surat & Proposal');
  const [docFile, setDocFile] = useState(null);
  const [docUrl, setDocUrl] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedAttendees, setEstimatedAttendees] = useState('');
  const [ketuaPelaksanaId, setKetuaPelaksanaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom modals state
  const [prokerToDelete, setProkerToDelete] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [fullActivitiesList, setFullActivitiesList] = useState([]);

  // Fetch prokers in real-time
  useEffect(() => {
    const colRef = collection(db, 'prokers');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setProkers(list);
      setLoadingProkers(false);
    }, (err) => {
      console.error(err);
      setLoadingProkers(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch users in real-time
  useEffect(() => {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      // Deduplicate by name and jabatan (case-insensitive)
      const uniqueMap = {};
      list.forEach((userItem) => {
        const nameKey = userItem.name?.toLowerCase().trim() || '';
        const jabatanKey = userItem.jabatan?.toLowerCase().trim() || '';
        const key = `${nameKey}_${jabatanKey}`;
        const existing = uniqueMap[key];
        if (!existing) {
          uniqueMap[key] = userItem;
        } else {
          // Prefer the profile that contains a photoURL
          if (userItem.photoURL && !existing.photoURL) {
            uniqueMap[key] = userItem;
          }
        }
      });
      const uniqueList = Object.values(uniqueMap);
      
      // Inject mock BEM users to ensure all positions/divisions have contents
      MOCK_BEM_USERS.forEach(mock => {
        const key = `${mock.name.toLowerCase().trim()}_${mock.jabatan.toLowerCase().trim()}`;
        if (!uniqueMap[key]) {
          uniqueList.push(mock);
        }
      });

      uniqueList.sort((a, b) => a.name?.localeCompare(b.name || '') || 0);
      
      setUsersList(uniqueList);
      setLoadingUsers(false);
    }, (err) => {
      console.error(err);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch activities in real-time
  useEffect(() => {
    const colRef = collection(db, 'activities');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setFullActivitiesList(list);
      setActivitiesList(list.slice(0, 8));
      setLoadingActivities(false);
    }, (err) => {
      console.error(err);
      setLoadingActivities(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch global documents in real-time
  useEffect(() => {
    const colRef = collection(db, 'global_documents');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setGlobalDocsList(list);
      setLoadingDocs(false);
    }, (err) => {
      console.error(err);
      setLoadingDocs(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUploadGlobalDoc = async (e) => {
    e.preventDefault();
    if (profile?.divisi !== 'BPH') {
      return setErrorDoc('Hanya pengurus BPH yang dapat menambah dokumen BEM Drive.');
    }
    if (!docName.trim()) {
      return setErrorDoc('Nama dokumen wajib diisi.');
    }

    const isPDD = docCategory === 'Dokumentasi PDD';

    if (isPDD) {
      if (!docUrl.trim()) {
        return setErrorDoc('Link Google Drive wajib diisi.');
      }
    } else {
      if (!docFile) {
        return setErrorDoc('Silakan pilih dokumen untuk diunggah.');
      }
      // Validate file size (max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
      if (docFile.size > MAX_SIZE) {
        return setErrorDoc('Ukuran file maksimal adalah 10 MB.');
      }
    }

    setSubmittingDoc(true);
    setErrorDoc('');

    try {
      let finalUrl = '';
      let fileNameVal = '';
      let fileSizeVal = 0;

      if (isPDD) {
        finalUrl = docUrl.trim();
        fileNameVal = 'Link Google Drive (Dokumentasi PDD)';
        fileSizeVal = 0;
      } else {
        // Create a reference in Firebase Storage
        const storageRef = ref(storage, `global_documents/${Date.now()}_${docFile.name}`);
        
        // Upload file
        const uploadResult = await uploadBytes(storageRef, docFile);
        
        // Get download URL
        finalUrl = await getDownloadURL(uploadResult.ref);
        fileNameVal = docFile.name;
        fileSizeVal = docFile.size;
      }

      await addDoc(collection(db, 'global_documents'), {
        name: docName.trim(),
        category: docCategory,
        url: finalUrl,
        fileName: fileNameVal,
        fileSize: fileSizeVal,
        uploadedBy: profile.name,
        uploadedById: user.uid,
        createdAt: serverTimestamp(),
      });

      // Log activity
      try {
        await addDoc(collection(db, 'activities'), {
          type: 'doc_upload',
          userName: profile.name,
          userRole: profile.jabatan,
          userPhoto: profile.photoURL || '',
          description: `mengunggah dokumen BEM Drive: "${docName.trim()}"`,
          createdAt: serverTimestamp(),
        });
      } catch (errLog) {
        console.error("Gagal mencatat log aktivitas:", errLog);
      }

      setDocName('');
      setDocFile(null);
      setDocUrl('');
      setDocDescription('');
      setDocCategory('Template Surat & Proposal');
      setIsDocModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorDoc('Gagal mengunggah dokumen. Coba lagi.');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleDeleteGlobalDoc = async (e, docId, docName) => {
    e.stopPropagation();
    if (profile?.divisi !== 'BPH') {
      return;
    }
    setDocToDelete({ id: docId, name: docName });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProker = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim() || !description.trim() || !ketuaPelaksanaId) {
      return setError('Semua kolom wajib diisi termasuk Ketua Pelaksana.');
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedKetPel = usersList.find(u => u.id === ketuaPelaksanaId);
      const ketuaPelaksanaName = selectedKetPel ? selectedKetPel.name : '';

      const docRef = await addDoc(collection(db, 'prokers'), {
        name: name.trim(),
        date,
        location: location.trim(),
        description: description.trim(),
        estimatedAttendees: parseInt(estimatedAttendees) || 0,
        status: 'Persiapan',
        proposalStatus: 'Drafting',
        panicActive: false,
        panicReport: null,
        createdBy: user.uid,
        createdByName: profile.name,
        createdAt: serverTimestamp(),
        ketuaPelaksanaId,
        ketuaPelaksanaName,
        members: [ketuaPelaksanaId],
      });

      // Log activity
      try {
        await addDoc(collection(db, 'activities'), {
          type: 'proker_create',
          userName: profile.name,
          userRole: profile.jabatan,
          userPhoto: profile.photoURL || '',
          description: `membuat program kerja baru "${name.trim()}" dengan Ketua Pelaksana "${ketuaPelaksanaName}"`,
          createdAt: serverTimestamp(),
        });
      } catch (errLog) {
        console.error("Gagal mencatat log aktivitas:", errLog);
      }

      // Reset Form & Close Modal
      setName('');
      setDate('');
      setLocation('');
      setDescription('');
      setEstimatedAttendees('');
      setKetuaPelaksanaId('');
      setIsModalOpen(false);

      // Redirect ke workspace proker yang baru dibuat
      navigate(`/proker/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat program kerja. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProker = async (e, prokerId, prokerName) => {
    e.stopPropagation(); // Cegah click card redirect
    setProkerToDelete({ id: prokerId, name: prokerName });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Persiapan': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'Aktif': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Selesai': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'LPJ': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Baru saja';
    // Handle Firestore serverTimestamp or vanilla Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const visibleProkers = prokers.filter((p) => {
    if (profile?.divisi === 'BPH') return true;
    return p.ketuaPelaksanaId === user?.uid || (p.members && p.members.includes(user?.uid));
  });

  const getUpcomingProkers = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return visibleProkers
      .filter((p) => p.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5); // Limit to 5 upcoming
  };

  const DEPARTMENTS_ORDER = ['BPH', 'PSDM', 'KOMINFO', 'PDD', 'ADVOKASI', 'MINAT BAKAT', 'SOSMAS'];

  const filteredUsers = usersList.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.jabatan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.divisi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMembers = {};
  filteredUsers.forEach((member) => {
    const div = member.divisi || 'LAINNYA';
    if (!groupedMembers[div]) groupedMembers[div] = [];
    groupedMembers[div].push(member);
  });

  const totalProkers = visibleProkers.length;
  const activeProkersCount = visibleProkers.filter(p => p.status === 'Aktif' || p.status === 'Persiapan').length;
  const completedProkersCount = visibleProkers.filter(p => p.status === 'Selesai' || p.status === 'LPJ').length;
  const totalMembersCount = usersList.length;

  const upcomingProkers = getUpcomingProkers();

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans pb-16 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-surface-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LogoBEM} alt="BEM Fasilkom UMB" className="w-10 h-10 object-cover rounded-full border border-white/10" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Fasilkom Proker</h1>
            <span className="text-slate-400 text-xs mt-1 block">BEM FASILKOM Universitas Mercu Buana</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-primary-400 rounded-xl border border-white/5 transition-all duration-200"
            title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white">{profile?.name}</div>
            <div className="text-xs text-slate-400">{profile?.jabatan} · <span className="text-primary-400 font-medium">{profile?.divisi}</span></div>
          </div>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} className="w-9 h-9 rounded-full ring-2 ring-primary-500/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center justify-center font-bold text-sm text-primary-400 ring-2 ring-primary-500/30">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-red-400 rounded-xl border border-white/5 transition-colors duration-200"
            title="Keluar Akun"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-10">
        {/* Banner Hero */}
        <section className={`mb-10 p-8 rounded-3xl border border-white/5 relative overflow-hidden ${theme === 'light' ? 'bg-surface-800 shadow-md' : 'bg-gradient-to-r from-primary-900/40 via-indigo-950/20 to-surface-800'}`}>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-primary-500/10 to-transparent pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-primary-600/20 text-primary-400 border border-primary-500/20 rounded-full text-xs font-semibold mb-4 inline-block">
              Workspace Kolaborasi BEM UMB
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Selamat Datang Kembali di FasilkomProker</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Kelola seluruh program kerja BEM FASILKOM secara real-time. Buat proker baru, bagi-bagi tugas antar divisi, atur RAB, rundown acara, hingga selesaikan LPJ secara kolaboratif.
            </p>
            {profile?.divisi === 'BPH' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Buat Program Kerja Baru
              </button>
            )}
          </div>
        </section>

        {/* 📊 QUICK STATS PANEL */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card p-5 flex items-center gap-4 bg-surface-800/80 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-400 flex items-center justify-center border border-primary-500/20">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{totalProkers}</div>
              <div className="text-slate-400 text-xs mt-0.5">Total Proker</div>
            </div>
          </div>
          
          <div className="card p-5 flex items-center gap-4 bg-surface-800/80 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{activeProkersCount}</div>
              <div className="text-slate-400 text-xs mt-0.5">Proker Aktif</div>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4 bg-surface-800/80 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{completedProkersCount}</div>
              <div className="text-slate-400 text-xs mt-0.5">Proker Selesai / LPJ</div>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4 bg-surface-800/80 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{totalMembersCount}</div>
              <div className="text-slate-400 text-xs mt-0.5">Pengurus BEM</div>
            </div>
          </div>
        </section>

        {/* GRID LAYOUT: LEFT CONTENT, RIGHT SIDEBAR */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: MAIN WORKSPACE (PROKER / MEMBERS TABS) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-white/5 gap-4 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('proker')}
                className={`pb-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'proker' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Daftar Program Kerja
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300 font-mono">{totalProkers}</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'members' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-4 h-4" /> Direktori Anggota BEM
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300 font-mono">{totalMembersCount}</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`pb-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'documents' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FolderOpen className="w-4 h-4" /> BEM Drive
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300 font-mono">{globalDocsList.length}</span>
              </button>
            </div>

            {/* TAB: PROGRAM KERJA */}
            {activeTab === 'proker' && (
              <div className="space-y-6">
                {loadingProkers ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="card p-6 h-52 animate-pulse flex flex-col justify-between bg-surface-800/50">
                        <div className="space-y-3">
                          <div className="h-6 w-2/3 bg-surface-700 rounded-lg" />
                          <div className="h-4 w-1/2 bg-surface-700 rounded-lg" />
                        </div>
                        <div className="h-5 w-1/3 bg-surface-700 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : visibleProkers.length === 0 ? (
                  <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-surface-800/30">
                    <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 text-slate-500 flex items-center justify-center mb-4">
                      <LayoutGrid className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">Belum ada Program Kerja</h4>
                    <p className="text-slate-400 text-sm max-w-sm mb-6">
                      {profile?.divisi === 'BPH'
                        ? 'Belum ada program kerja yang ditambahkan. Silakan klik tombol di bawah untuk membuat program kerja pertama BEM Anda.'
                        : 'Anda belum terdaftar di kepanitiaan program kerja manapun. Hubungi BPH atau Ketua Pelaksana untuk bergabung.'}
                    </p>
                    {profile?.divisi === 'BPH' && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                      >
                        <Plus className="w-5 h-5" /> Buat Proker Pertama
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleProkers.map((proker) => (
                      <div
                        key={proker.id}
                        onClick={() => navigate(`/proker/${proker.id}`)}
                        className="card p-6 hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-900/10 cursor-pointer flex flex-col justify-between transition-all duration-300 group bg-surface-800"
                      >
                        <div>
                          {/* Badge & Action Header */}
                          <div className="flex items-center justify-between mb-4">
                            <span className={`badge ${getStatusColor(proker.status)}`}>
                              {proker.status}
                            </span>
                            {profile?.divisi === 'BPH' && (
                              <button
                                onClick={(e) => handleDeleteProker(e, proker.id, proker.name)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Hapus Proker"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Proker Info */}
                          <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-primary-400 transition-colors">
                            {proker.name}
                          </h4>
                          <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
                            {proker.description}
                          </p>
                        </div>

                        {/* Card Footer Details */}
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(proker.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {proker.location}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              Est. {proker.estimatedAttendees || 0} Peserta
                            </span>
                            <span className="text-primary-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Masuk Workspace <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: DIREKTORI BEM */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pengurus BEM (Nama, divisi, atau jabatan)..."
                    className="input pl-11 bg-surface-800"
                  />
                </div>

                {loadingUsers ? (
                  <div className="space-y-6">
                    {[1, 2].map((n) => (
                      <div key={n} className="space-y-3 animate-pulse">
                        <div className="h-5 w-24 bg-surface-700 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="card p-4 h-16 bg-surface-800/50" />
                          <div className="card p-4 h-16 bg-surface-800/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Anggota BEM tidak ditemukan dengan pencarian tersebut.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {DEPARTMENTS_ORDER.map((dept) => {
                      const members = groupedMembers[dept] || [];
                      if (members.length === 0) return null;
                      return (
                        <div key={dept} className="space-y-3">
                          <h4 className="text-xs font-bold text-primary-400 uppercase tracking-widest px-1">
                            {dept === 'BPH' ? 'BPH (Pengurus Harian)' : `Departemen ${dept}`}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {members.map((member) => (
                              <div key={member.id} className="card p-4 bg-surface-800/80 border border-white/5 flex items-center gap-3">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt={member.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary-500/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center font-bold text-sm text-primary-400 ring-2 ring-primary-500/10">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-white truncate">{member.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{member.jabatan}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(groupedMembers).filter(d => !DEPARTMENTS_ORDER.includes(d)).map((dept) => {
                      const members = groupedMembers[dept] || [];
                      if (members.length === 0) return null;
                      return (
                        <div key={dept} className="space-y-3">
                          <h4 className="text-xs font-bold text-primary-400 uppercase tracking-widest px-1">
                            Divisi {dept}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {members.map((member) => (
                              <div key={member.id} className="card p-4 bg-surface-800/80 border border-white/5 flex items-center gap-3">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt={member.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary-500/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center font-bold text-sm text-primary-400 ring-2 ring-primary-500/10">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-white truncate">{member.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{member.jabatan}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: BEM DRIVE */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Search Bar & Upload Button */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder="Cari dokumen, SOP, template..."
                      className="input pl-11 bg-surface-800"
                    />
                  </div>
                  {profile?.divisi === 'BPH' && (
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Tambah Dokumen
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {['Semua', 'Template Surat & Proposal', 'SK BEM', 'Pedoman Kerja & SOP', 'Arsip Laporan', 'Dokumentasi PDD', 'Lainnya'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedDocCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-250 border ${
                        selectedDocCategory === cat
                          ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-950/20'
                          : 'bg-surface-800 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-surface-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Docs Grid */}
                {loadingDocs ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="card p-5 h-40 animate-pulse bg-surface-800/50 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="h-4 w-1/4 bg-surface-700 rounded" />
                          <div className="h-5 w-3/4 bg-surface-700 rounded" />
                        </div>
                        <div className="h-4 w-1/3 bg-surface-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const filteredDocs = globalDocsList.filter(docItem => {
                    const matchesSearch = docItem.name?.toLowerCase().includes(docSearchQuery.toLowerCase()) || 
                                          docItem.description?.toLowerCase().includes(docSearchQuery.toLowerCase());
                    const matchesCategory = selectedDocCategory === 'Semua' || docItem.category === selectedDocCategory;
                    return matchesSearch && matchesCategory;
                  });

                  if (filteredDocs.length === 0) {
                    return (
                      <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-surface-800/30">
                        <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 text-slate-500 flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-1">Dokumen Tidak Ditemukan</h4>
                        <p className="text-slate-400 text-sm max-w-sm">
                          Belum ada dokumen yang sesuai dengan filter atau pencarian Anda.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredDocs.map((docItem) => (
                        <div
                          key={docItem.id}
                          className="card p-5 bg-surface-800 border border-white/5 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-950/10 transition-all duration-300 flex flex-col justify-between group relative"
                        >
                          {profile?.divisi === 'BPH' && (
                            <button
                              onClick={(e) => handleDeleteGlobalDoc(e, docItem.id, docItem.name)}
                              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                              title="Hapus Dokumen"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                          <div className="space-y-3">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                              {docItem.category}
                            </span>
                            <h4 className="text-base font-bold text-white leading-snug group-hover:text-primary-400 transition-colors pt-1 flex items-center gap-2 pr-6">
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="truncate" title={docItem.name}>{docItem.name}</span>
                            </h4>
                            {docItem.description && (
                              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                                {docItem.description}
                              </p>
                            )}
                          </div>
                          <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                            <div className="text-[10px] text-slate-500">
                              Diunggah oleh <span className="text-slate-300 font-medium">{docItem.uploadedBy}</span>
                              <span className="block mt-0.5 text-[9px]">{getRelativeTime(docItem.createdAt)}</span>
                            </div>
                            <a
                              href={docItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-surface-700 hover:bg-primary-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-200 border border-white/5 hover:border-primary-500/30"
                            >
                              Buka <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR WIDGETS */}
          <div className="space-y-6">
            {/* WIDGET: TIMELINE AGENDA TERDEKAT */}
            <div className="card p-6 bg-surface-800 border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Agenda Terdekat
              </h3>

              {loadingProkers ? (
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-12 bg-surface-700/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingProkers.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-2">
                  Tidak ada agenda terdekat dalam waktu dekat.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                  {upcomingProkers.map((proker) => (
                    <div
                      key={proker.id}
                      onClick={() => navigate(`/proker/${proker.id}`)}
                      className="pl-7 relative group cursor-pointer"
                    >
                      <div className="absolute left-[9px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 group-hover:scale-125 transition-transform border border-surface-800" />
                      <div className="text-xs font-bold text-slate-200 group-hover:text-primary-400 transition-colors truncate">{proker.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{new Date(proker.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span>·</span>
                        <span className="truncate">{proker.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WIDGET: AKTIVITAS TERBARU (REAL-TIME AUDIT LOG) */}
            <div className="card p-6 bg-surface-800 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-primary-400" /> Aktivitas Terbaru
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20"
                >
                  Riwayat Event
                </button>
              </div>

              {loadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 animate-pulse">
                      <div className="w-7 h-7 bg-surface-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-700 rounded w-3/4" />
                        <div className="h-2 bg-surface-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesList.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-4 text-center">
                  Belum ada catatan aktivitas BEM.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {activitiesList.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      {act.userPhoto ? (
                        <img src={act.userPhoto} alt={act.userName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-surface-700 text-primary-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {act.userName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300">
                          <span className="font-bold text-white mr-1">{act.userName}</span>
                          <span className="text-slate-400">{act.description}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-2.5 h-2.5 text-slate-600" />
                          {getRelativeTime(act.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Create Proker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-start justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-lg p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <h3 className="text-xl font-bold text-white mb-1">Buat Program Kerja Baru</h3>
            <p className="text-slate-400 text-sm mb-6">Lengkapi data berikut untuk membuat workspace program kerja baru.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProker} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Nama Program Kerja</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pemilwa BEM FASILKOM 2026"
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Estimasi Peserta</label>
                  <input
                    type="number"
                    value={estimatedAttendees}
                    onChange={(e) => setEstimatedAttendees(e.target.value)}
                    placeholder="Contoh: 150"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Lokasi Pelaksanaan</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Gazebo Kampus Meruya / Aula"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Ketua Pelaksana</label>
                <select
                  value={ketuaPelaksanaId}
                  onChange={(e) => setKetuaPelaksanaId(e.target.value)}
                  className="select w-full"
                  required
                >
                  <option value="" disabled>Pilih Ketua Pelaksana</option>
                  {usersList.map((userOption) => (
                    <option key={userOption.id} value={userOption.id} className="bg-surface-800 text-slate-100">
                      {userOption.name} ({userOption.jabatan || 'Anggota'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Deskripsi Program Kerja</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan deskripsi singkat atau tujuan utama dari program kerja ini..."
                  className="input h-24 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-create-proker"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Buat Program Kerja'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Global Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-start justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-lg p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <h3 className="text-xl font-bold text-white mb-1">Tambah Dokumen BEM Drive</h3>
            <p className="text-slate-400 text-sm mb-6">Unggah file dokumen penting (SOP, template, proposal, dsb. maks 10 MB) langsung ke BEM Drive global.</p>

            {errorDoc && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {errorDoc}
              </div>
            )}

            <form onSubmit={handleUploadGlobalDoc} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Nama Dokumen</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Contoh: Template Kop Surat BEM 2026"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Kategori</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="input py-2.5 bg-surface-800 border-white/10 text-slate-100"
                  required
                >
                  <option value="Template Surat & Proposal">Template Surat & Proposal</option>
                  <option value="SK BEM">SK BEM (Surat Keputusan)</option>
                  <option value="Pedoman Kerja & SOP">Pedoman Kerja & SOP</option>
                  <option value="Arsip Laporan">Arsip Laporan</option>
                  <option value="Dokumentasi PDD">Dokumentasi PDD (Link GDrive)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {docCategory === 'Dokumentasi PDD' ? (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Link Google Drive (Dokumentasi PDD)</label>
                  <input
                    type="url"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="input"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Pilih File Dokumen (Maks 10 MB)</label>
                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files[0])}
                    className="input file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
                    required
                  />
                  {docFile && (
                    <div className="text-xs text-slate-400 mt-2">
                      Ukuran: {(docFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Deskripsi Singkat</label>
                <textarea
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Masukkan keterangan tambahan, informasi versi, atau petunjuk penggunaan..."
                  className="input h-24 resize-none text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="btn-secondary"
                  disabled={submittingDoc}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="btn-primary px-6"
                >
                  {submittingDoc ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Unggah Dokumen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal untuk Konfirmasi Penghapusan Proker */}
      {prokerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-center justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-md p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Hapus Program Kerja?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Apakah Anda yakin ingin menghapus program kerja <span className="text-white font-semibold">"{prokerToDelete.name}"</span> beserta semua datanya? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setProkerToDelete(null)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = prokerToDelete.id;
                  const name = prokerToDelete.name;
                  setProkerToDelete(null);
                  try {
                    await deleteDoc(doc(db, 'prokers', id));
                    await addDoc(collection(db, 'activities'), {
                      type: 'proker_delete',
                      userName: profile.name,
                      userRole: profile.jabatan,
                      userPhoto: profile.photoURL || '',
                      description: `menghapus program kerja "${name}" beserta semua datanya`,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    console.error(err);
                    setError('Gagal menghapus program kerja.');
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 px-4 text-sm font-semibold transition-all duration-200"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal untuk Konfirmasi Penghapusan Dokumen BEM Drive */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-center justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-md p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Hapus Dokumen BEM Drive?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Apakah Anda yakin ingin menghapus dokumen <span className="text-white font-semibold">"{docToDelete.name}"</span> dari BEM Drive?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = docToDelete.id;
                  const name = docToDelete.name;
                  setDocToDelete(null);
                  try {
                    await deleteDoc(doc(db, 'global_documents', id));
                    await addDoc(collection(db, 'activities'), {
                      type: 'doc_delete',
                      userName: profile.name,
                      userRole: profile.jabatan,
                      userPhoto: profile.photoURL || '',
                      description: `menghapus dokumen BEM Drive "${name}"`,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    console.error(err);
                    setErrorDoc('Gagal menghapus dokumen.');
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 px-4 text-sm font-semibold transition-all duration-200"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histori Pembuatan & Penghapusan Event */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-center justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-2xl p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                <h3 className="text-xl font-bold text-white">Histori Pembuatan & Penghapusan Event</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {(() => {
                const eventHistory = fullActivitiesList.filter(
                  (act) => act.type === 'proker_create' || act.type === 'proker_delete'
                );

                if (eventHistory.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Belum ada riwayat pembuatan atau penghapusan program kerja.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {eventHistory.map((act) => {
                      const isCreate = act.type === 'proker_create';
                      return (
                        <div key={act.id} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-900/40 border border-white/5 transition-all hover:bg-surface-900/60">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                            isCreate 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {isCreate ? <Plus className="w-4.5 h-4.5" /> : <Trash className="w-4.5 h-4.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200">
                              <span className="font-bold text-white mr-1.5">{act.userName}</span>
                              <span className="text-slate-400">({act.userRole})</span>
                              <div className="text-slate-300 mt-1 font-medium leading-relaxed">{act.description}</div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-600" />
                              {getRelativeTime(act.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="btn-secondary py-2 px-6 text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
