import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProker } from '../../hooks/useProker';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// Icons
import {
  Home, LogOut, LayoutDashboard, Lightbulb, FileText, Users,
  CalendarDays, Package, Share2, Image, Coffee, Heart, Flame, ShieldAlert, FileSpreadsheet, Menu, X, Sun, Moon
} from 'lucide-react';
import LogoBEM from '../../assets/logo-bem.png';

// Views
import Overview from './views/Overview';
import Brainstorming from './views/Brainstorming';
import Notulensi from './views/Notulensi';
import BPH from './views/BPH';
import DivisiAcara from './views/DivisiAcara';
import DivisiPerlap from './views/DivisiPerlap';
import DivisiHumas from './views/DivisiHumas';
import DivisiPDD from './views/DivisiPDD';
import DivisiKonsum from './views/DivisiKonsum';
import DivisiKesehatan from './views/DivisiKesehatan';
import DDay from './views/DDay';
import LPJ from './views/LPJ';
import DokumenProker from './views/DokumenProker';
import Panitia from './views/Panitia';
import LayoutWorkspace from './views/LayoutWorkspace';

export default function WorkspaceLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { proker, loading, updateProkerDetails } = useProker(id);

  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme states
  const [theme, setTheme] = useState(localStorage.getItem('FasilkomProker-theme') || 'dark');
  const [currentUserUids, setCurrentUserUids] = useState(user?.uid ? [user.uid] : []);

  useEffect(() => {
    if (user?.uid) {
      setCurrentUserUids(prev => prev.includes(user.uid) ? prev : [...prev, user.uid]);
    }
  }, [user]);

  useEffect(() => {
    if (!profile?.name || !user?.uid) return;
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const uids = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.name?.toLowerCase().trim() === profile.name?.toLowerCase().trim() &&
          data.jabatan?.toLowerCase().trim() === profile.jabatan?.toLowerCase().trim()
        ) {
          uids.push(docSnap.id);
        }
      });
      if (!uids.includes(user.uid)) {
        uids.push(user.uid);
      }
      setCurrentUserUids(uids);
    }, (err) => {
      console.error("Gagal memuat UIDs user:", err);
    });
    return () => unsubscribe();
  }, [profile, user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={LogoBEM} alt="BEM Fasilkom UMB" className="w-16 h-16 object-cover rounded-full border-2 border-white/10 animate-pulse" />
          <p className="text-slate-400 text-sm">Memuat Workspace Kepanitiaan...</p>
        </div>
      </div>
    );
  }

  if (!proker) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Program Kerja Tidak Ditemukan</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Workspace program kerja yang Anda cari tidak ada atau telah dihapus oleh pengurus BPH.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
            <Home className="w-4 h-4" /> Kembali Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const isBPH = profile?.divisi === 'BPH';
  const isKetuaPelaksana = currentUserUids.includes(proker.ketuaPelaksanaId);
  const isMember = proker.members && proker.members.some(uid => currentUserUids.includes(uid));
  const hasAccess = isBPH || isKetuaPelaksana || isMember;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center space-y-4 bg-surface-800 border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Anda tidak terdaftar sebagai panitia dalam program kerja ini. Hanya BPH, Ketua Pelaksana, dan Anggota Panitia yang dapat mengakses workspace ini.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
            <Home className="w-4 h-4" /> Kembali Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'brainstorming', label: 'Brainstorming', icon: Lightbulb },
    { id: 'notulensi', label: 'Notulensi Rapat', icon: FileText },
    { id: 'dokumen', label: 'Dokumen Proker', icon: FileText },
    { id: 'layout', label: 'Layout Floor Plan', icon: Map },
    { id: 'panitia', label: 'Panitia & Anggota', icon: Users },
    { id: 'bph', label: 'BPH & RAB', icon: Users, division: 'BPH' },
    { id: 'acara', label: 'Divisi Acara', icon: CalendarDays, division: 'Acara' },
    { id: 'perlap', label: 'Divisi Perlengkapan', icon: Package, division: 'Perlengkapan' },
    { id: 'humas', label: 'Divisi Humas', icon: Share2, division: 'Humas' },
    { id: 'pdd', label: 'Divisi PDD', icon: Image, division: 'PDD' },
    { id: 'konsum', label: 'Divisi Konsumsi', icon: Coffee, division: 'Konsumsi' },
    { id: 'kesehatan', label: 'Divisi Kesehatan', icon: Heart, division: 'Kesehatan' },
    { id: 'dday', label: 'D-Day Live', icon: Flame },
    { id: 'lpj', label: 'LPJ & Evaluasi', icon: FileSpreadsheet },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview': return <Overview proker={proker} profile={profile} updateProkerDetails={updateProkerDetails} />;
      case 'brainstorming': return <Brainstorming proker={proker} profile={profile} />;
      case 'notulensi': return <Notulensi proker={proker} profile={profile} />;
      case 'bph': return <BPH proker={proker} profile={profile} updateProkerDetails={updateProkerDetails} />;
      case 'acara': return <DivisiAcara proker={proker} profile={profile} />;
      case 'perlap': return <DivisiPerlap proker={proker} profile={profile} />;
      case 'humas': return <DivisiHumas proker={proker} profile={profile} />;
      case 'pdd': return <DivisiPDD proker={proker} profile={profile} />;
      case 'konsum': return <DivisiKonsum proker={proker} profile={profile} />;
      case 'kesehatan': return <DivisiKesehatan proker={proker} profile={profile} />;
      case 'dday': return <DDay proker={proker} profile={profile} updateProkerDetails={updateProkerDetails} />;
      case 'lpj': return <LPJ proker={proker} profile={profile} />;
      case 'dokumen': return <DokumenProker proker={proker} profile={profile} user={user} />;
      case 'layout': return <LayoutWorkspace proker={proker} profile={profile} />;
      case 'panitia': return <Panitia proker={proker} currentProfile={profile} updateProkerDetails={updateProkerDetails} />;
      default: return <Overview proker={proker} profile={profile} updateProkerDetails={updateProkerDetails} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col relative overflow-x-hidden">
      
      {/* ⚠️ PANIC STATUS D-DAY GLOBAL WARNING BANNER */}
      {proker.panicActive && (
        <div className="bg-red-600 text-white font-bold text-center px-4 py-3 flex items-center justify-center gap-2 relative z-50 text-xs sm:text-sm animate-pulse shadow-lg shadow-red-900/40 border-b border-red-500">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>
            ⚠️ KEADAAN DARURAT AKTIF: "{proker.panicReport?.description}" (Laporan: {proker.panicReport?.reporterName} pukul {proker.panicReport?.time})
          </span>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="flex-1 flex relative">
        {/* Sidebar Nav */}
        <aside className={`w-64 border-r border-white/5 bg-surface-800 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transform lg:transform-none lg:sticky ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="p-4 flex-1 flex flex-col overflow-y-auto">
            {/* Header / Brand in Sidebar */}
            <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2.5">
                <img src={LogoBEM} alt="BEM Fasilkom UMB" className="w-9 h-9 object-cover rounded-full border border-white/10" />
                <div>
                  <h2 className="text-sm font-bold leading-none text-white">FasilkomProker Workspace</h2>
                  <span className="text-[10px] text-slate-400 mt-1 block">BEM FASILKOM UMB</span>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Back to Home Navigation */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-3 py-2.5 bg-surface-700/50 hover:bg-surface-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all mb-6 border border-white/5"
            >
              <Home className="w-4 h-4 text-primary-400" /> Kembali Ke Beranda
            </button>

            {/* Navigation links */}
            <nav className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Workspace Menu</div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                    {item.division && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-700 text-slate-400 font-sans uppercase">
                        {item.division}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Signout footer in Sidebar */}
          <div className="p-4 border-t border-white/5 bg-surface-900/50 flex items-center justify-between gap-3">
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{profile?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{profile?.jabatan}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-surface-800 hover:bg-surface-700 hover:text-red-400 rounded-xl border border-white/5 text-slate-400 transition-colors"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden" />
        )}

        {/* Dashboard Main Content Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Main Top Header Navbar */}
          <header className="sticky top-0 z-20 border-b border-white/5 bg-surface-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-surface-800 hover:bg-surface-700 border border-white/5 rounded-xl text-slate-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-white leading-tight tracking-tight uppercase">
                  {proker.name}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Workspace: <strong className="text-primary-400 uppercase">{activeTab}</strong></span>
                  <span>·</span>
                  <span>Status: <strong className="text-yellow-400 font-semibold">{proker.status}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-primary-400 rounded-xl border border-white/5 transition-all duration-200"
                title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-8 h-8 rounded-full ring-2 ring-primary-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center font-bold text-xs text-primary-400 ring-2 ring-primary-500/30">
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-300 font-semibold hidden sm:inline">{profile?.name}</span>
            </div>
          </header>

          {/* Render Active View Container */}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
