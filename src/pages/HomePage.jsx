import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { Plus, Calendar, MapPin, Users, LogOut, Trash, ArrowRight, LayoutGrid, Search, Activity, Clock, TrendingUp, Sparkles, UserPlus, FolderKanban, ClipboardCheck } from 'lucide-react';

export default function HomePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [prokers, setProkers] = useState([]);
  const [loadingProkers, setLoadingProkers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats and lists states
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activitiesList, setActivitiesList] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activeTab, setActiveTab] = useState('proker');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedAttendees, setEstimatedAttendees] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      list.sort((a, b) => a.name?.localeCompare(b.name || '') || 0);
      setUsersList(list);
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
      setActivitiesList(list.slice(0, 8));
      setLoadingActivities(false);
    }, (err) => {
      console.error(err);
      setLoadingActivities(false);
    });

    return () => unsubscribe();
  }, []);

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
    if (!name.trim() || !date || !location.trim() || !description.trim()) {
      return setError('Semua kolom wajib diisi.');
    }

    setSubmitting(true);
    setError('');

    try {
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
      });

      // Log activity
      try {
        await addDoc(collection(db, 'activities'), {
          type: 'proker_create',
          userName: profile.name,
          userRole: profile.jabatan,
          userPhoto: profile.photoURL || '',
          description: `membuat program kerja baru "${name.trim()}"`,
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
    if (window.confirm(`Apakah Anda yakin ingin menghapus program kerja "${prokerName}" beserta semua datanya?`)) {
      try {
        await deleteDoc(doc(db, 'prokers', prokerId));

        // Log activity
        try {
          await addDoc(collection(db, 'activities'), {
            type: 'proker_delete',
            userName: profile.name,
            userRole: profile.jabatan,
            userPhoto: profile.photoURL || '',
            description: `menghapus program kerja "${prokerName}"`,
            createdAt: serverTimestamp(),
          });
        } catch (errLog) {
          console.error("Gagal mencatat log aktivitas:", errLog);
        }
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus program kerja.');
      }
    }
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

  const getUpcomingProkers = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return prokers
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

  const totalProkers = prokers.length;
  const activeProkersCount = prokers.filter(p => p.status === 'Aktif' || p.status === 'Persiapan').length;
  const completedProkersCount = prokers.filter(p => p.status === 'Selesai' || p.status === 'LPJ').length;
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <span className="text-white font-bold">FP</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Fasilkom Proker</h1>
            <span className="text-slate-400 text-xs mt-1 block">BEM FASILKOM Universitas Mercu Buana</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
        <section className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-primary-900/40 via-indigo-950/20 to-surface-800 border border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-primary-500/10 to-transparent pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-primary-600/20 text-primary-400 border border-primary-500/20 rounded-full text-xs font-semibold mb-4 inline-block">
              Workspace Kolaborasi BEM UMB
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Selamat Datang Kembali di ProkerKU</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Kelola seluruh program kerja BEM FASILKOM secara real-time. Buat proker baru, bagi-bagi tugas antar divisi, atur RAB, rundown acara, hingga selesaikan LPJ secara kolaboratif.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Buat Program Kerja Baru
            </button>
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
            <div className="flex border-b border-white/5 gap-4">
              <button
                onClick={() => setActiveTab('proker')}
                className={`pb-3 text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'proker' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Daftar Program Kerja
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300 font-mono">{totalProkers}</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-3 text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'members' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-4 h-4" /> Direktori Anggota BEM
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300 font-mono">{totalMembersCount}</span>
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
                ) : prokers.length === 0 ? (
                  <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-surface-800/30">
                    <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 text-slate-500 flex items-center justify-center mb-4">
                      <LayoutGrid className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">Belum ada Program Kerja</h4>
                    <p className="text-slate-400 text-sm max-w-sm mb-6">
                      Belum ada program kerja yang ditambahkan. Silakan klik tombol di bawah untuk membuat program kerja pertama BEM Anda.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-5 h-5" /> Buat Proker Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prokers.map((proker) => (
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
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-primary-400" /> Aktivitas Terbaru
              </h3>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800">
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
    </div>
  );
}
