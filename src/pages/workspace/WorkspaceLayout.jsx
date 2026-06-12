import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProker } from '../../hooks/useProker';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

// Icons
import {
  Home, LogOut, LayoutDashboard, Lightbulb, FileText, Users,
  CalendarDays, Package, Share2, Image, Coffee, Heart, Flame, ShieldAlert, FileSpreadsheet, Menu, X
} from 'lucide-react';

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

export default function WorkspaceLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { proker, loading, updateProkerDetails } = useProker(id);

  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">FP</span>
          </div>
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
      case 'overview': return <Overview proker={proker} updateProkerDetails={updateProkerDetails} />;
      case 'brainstorming': return <Brainstorming proker={proker} />;
      case 'notulensi': return <Notulensi proker={proker} />;
      case 'bph': return <BPH proker={proker} updateProkerDetails={updateProkerDetails} />;
      case 'acara': return <DivisiAcara proker={proker} />;
      case 'perlap': return <DivisiPerlap proker={proker} />;
      case 'humas': return <DivisiHumas proker={proker} />;
      case 'pdd': return <DivisiPDD proker={proker} />;
      case 'konsum': return <DivisiKonsum proker={proker} />;
      case 'kesehatan': return <DivisiKesehatan proker={proker} />;
      case 'dday': return <DDay proker={proker} updateProkerDetails={updateProkerDetails} />;
      case 'lpj': return <LPJ proker={proker} />;
      default: return <Overview proker={proker} updateProkerDetails={updateProkerDetails} />;
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FP</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold leading-none text-white">ProkerKU Workspace</h2>
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
