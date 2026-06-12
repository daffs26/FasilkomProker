import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, UserPlus, UserMinus, ShieldAlert, Crown, User, X } from 'lucide-react';


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

export default function Panitia({ proker, currentProfile, updateProkerDetails }) {
  const [usersList, setUsersList] = useState([]);
  const [rawUsersList, setRawUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Fetch all BEM members
  useEffect(() => {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      // Inject mock BEM users to ensure all positions/divisions have contents
      MOCK_BEM_USERS.forEach(mock => {
        if (!list.some(u => u.id === mock.id)) {
          list.push(mock);
        }
      });

      list.sort((a, b) => a.name?.localeCompare(b.name || '') || 0);
      setRawUsersList(list);

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
          // Prefer profile with photoURL
          if (userItem.photoURL && !existing.photoURL) {
            uniqueMap[key] = userItem;
          }
        }
      });
      const uniqueList = Object.values(uniqueMap);
      uniqueList.sort((a, b) => a.name?.localeCompare(b.name || '') || 0);
      
      setUsersList(uniqueList);
      setLoadingUsers(false);
    }, (err) => {
      console.error("Gagal memuat anggota BEM:", err);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  const isBPH = currentProfile?.divisi === 'BPH';

  // Find profile of current user in rawUsersList to support matching duplicate UIDs
  const currentUserRawProfile = rawUsersList.find(u => u.id === auth.currentUser?.uid);

  // Find raw and unique profiles for Ketua Pelaksana
  const kpRawProfile = rawUsersList.find(u => u.id === proker.ketuaPelaksanaId);
  const kpProfile = kpRawProfile ? (
    usersList.find(u => 
      u.name?.toLowerCase().trim() === kpRawProfile.name?.toLowerCase().trim() &&
      u.jabatan?.toLowerCase().trim() === kpRawProfile.jabatan?.toLowerCase().trim()
    ) || kpRawProfile
  ) : null;

  const isKetuaPelaksana = auth.currentUser?.uid && proker.ketuaPelaksanaId && (
    auth.currentUser.uid === proker.ketuaPelaksanaId ||
    (currentUserRawProfile && kpProfile &&
      currentUserRawProfile.name?.toLowerCase().trim() === kpProfile.name?.toLowerCase().trim() &&
      currentUserRawProfile.jabatan?.toLowerCase().trim() === kpProfile.jabatan?.toLowerCase().trim()
    )
  );

  const canManage = isBPH || isKetuaPelaksana;

  const committeeMembers = proker.members || [];
  
  // Map member IDs to actual user profile objects and deduplicate them by name and jabatan
  const rawMembersProfiles = rawUsersList.filter(u => committeeMembers.includes(u.id));
  const uniqueMembersMap = {};
  rawMembersProfiles.forEach((m) => {
    const uniqueProf = usersList.find(u => 
      u.name?.toLowerCase().trim() === m.name?.toLowerCase().trim() &&
      u.jabatan?.toLowerCase().trim() === m.jabatan?.toLowerCase().trim()
    ) || m;
    const key = `${uniqueProf.name?.toLowerCase().trim()}_${uniqueProf.jabatan?.toLowerCase().trim()}`;
    uniqueMembersMap[key] = uniqueProf;
  });
  const membersProfiles = Object.values(uniqueMembersMap);

  // Get unique list of name+jabatan keys that are already in the committee (including KP)
  const existingCommitteeKeys = new Set();
  if (kpProfile) {
    existingCommitteeKeys.add(`${kpProfile.name?.toLowerCase().trim()}_${kpProfile.jabatan?.toLowerCase().trim()}`);
  }
  membersProfiles.forEach(m => {
    existingCommitteeKeys.add(`${m.name?.toLowerCase().trim()}_${m.jabatan?.toLowerCase().trim()}`);
  });

  // Filter users to only those who are NOT already in the committee (either as KP or member)
  const eligibleUsers = usersList.filter(u => {
    const key = `${u.name?.toLowerCase().trim()}_${u.jabatan?.toLowerCase().trim()}`;
    return !existingCommitteeKeys.has(key);
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    setError('');

    try {
      const invitedUser = usersList.find(u => u.id === selectedUserId);
      if (!invitedUser) throw new Error('Pengguna tidak ditemukan.');

      // Update members array in Firestore
      const docRef = doc(db, 'prokers', proker.id);
      await updateDoc(docRef, {
        members: arrayUnion(selectedUserId)
      });

      // Log activity
      await addDoc(collection(db, 'activities'), {
        type: 'proker_member_add',
        userName: currentProfile.name,
        userRole: currentProfile.jabatan,
        userPhoto: currentProfile.photoURL || '',
        description: `mengundang ${invitedUser.name} ke dalam Kepanitiaan proker "${proker.name}"`,
        createdAt: serverTimestamp(),
      });

      setSelectedUserId('');
    } catch (err) {
      console.error(err);
      setError('Gagal mengundang anggota.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (member) => {
    setMemberToRemove(member);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge bg-primary-600/20 text-primary-400 border border-primary-500/20 mb-3">
            Kepanitiaan & Anggota
          </span>
          <h2 className="text-2xl font-bold text-white mb-1">Struktur Kepanitiaan</h2>
          <p className="text-slate-400 text-sm">Kelola dan lihat daftar anggota yang bertugas pada program kerja ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Ketua Pelaksana & Members List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ketua Pelaksana Card */}
          <div className="card p-6 bg-gradient-to-r from-primary-900/30 via-indigo-950/10 to-surface-800 border-primary-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Crown className="w-24 h-24 text-primary-400" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center flex-shrink-0">
                <Crown className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Ketua Pelaksana (PIC)</div>
                <h3 className="text-xl font-bold text-white">
                  {kpProfile ? kpProfile.name : proker.ketuaPelaksanaName || 'Belum Ditentukan'}
                </h3>
                <p className="text-slate-300 text-sm">
                  {kpProfile ? `${kpProfile.jabatan} · ${kpProfile.divisi}` : 'PIC Program Kerja'}
                </p>
                <div className="text-slate-400 text-xs mt-2 font-mono flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Penanggung Jawab Utama
                </div>
              </div>
            </div>
          </div>

          {/* Committee Members List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" /> Anggota Panitia ({membersProfiles.length})
            </h3>

            {loadingUsers ? (
              <div className="card p-8 text-center text-slate-400 text-sm animate-pulse">
                Memuat daftar panitia...
              </div>
            ) : membersProfiles.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-surface-800/30">
                <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 text-slate-500 flex items-center justify-center mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">Belum ada Anggota</h4>
                <p className="text-slate-400 text-sm max-w-sm">
                  {canManage 
                    ? 'Silakan gunakan panel di samping untuk mengundang anggota BEM BPH/Divisi lain ke dalam kepanitiaan ini.' 
                    : 'Ketua Pelaksana atau BPH belum mengundang anggota lain ke proker ini.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {membersProfiles.map((member) => (
                  <div key={member.id} className="card p-4 flex items-center justify-between bg-surface-800 hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} className="w-10 h-10 rounded-full border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-700 text-slate-300 flex items-center justify-center font-bold text-sm">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white">{member.name}</div>
                        <div className="text-xs text-slate-400">{member.jabatan} · <span className="text-primary-400 font-medium">{member.divisi}</span></div>
                      </div>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Keluarkan dari Panitia"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invite Panel (visible to KP and BPH only) */}
        {canManage ? (
          <div className="card p-6 self-start bg-surface-800 border-white/5 space-y-4">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2 mb-1">
                <UserPlus className="w-5 h-5 text-primary-400" /> Undang Anggota
              </h3>
              <p className="text-xs text-slate-400">Undang anggota BEM lain untuk bergabung ke dalam tim kerja proker ini.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4 pt-2">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Pilih Anggota BEM</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="select w-full"
                  required
                >
                  <option value="" disabled>Pilih Anggota</option>
                  {eligibleUsers.map((bemUser) => (
                    <option key={bemUser.id} value={bemUser.id} className="bg-surface-800 text-slate-100">
                      {bemUser.name} ({bemUser.jabatan || 'Anggota'} - {bemUser.divisi})
                    </option>
                  ))}
                </select>
              </div>

              {eligibleUsers.length === 0 && !loadingUsers && (
                <p className="text-slate-500 text-xs italic">Semua anggota BEM telah diundang atau tergabung.</p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedUserId}
                className="btn-primary w-full py-2.5 text-xs flex justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> {submitting ? 'Mengundang...' : 'Undang Ke Panitia'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card p-6 self-start bg-surface-800/40 border-white/5 flex flex-col items-center text-center">
            <ShieldAlert className="w-8 h-8 text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Akses Manajemen Terbatas</h4>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Hanya Ketua Pelaksana dan BPH yang memiliki otorisasi untuk menambah atau mengeluarkan anggota.
            </p>
          </div>
        )}
      </div>

      {/* Custom Modal untuk Konfirmasi Mengeluarkan Anggota Panitia */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-900/80 backdrop-blur-sm flex items-center justify-center p-4 py-10 animate-fade-in">
          <div className="card w-full max-w-md p-6 relative overflow-hidden animate-slide-up shadow-2xl border-white/10 bg-surface-800 my-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Keluarkan Anggota Panitia?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Apakah Anda yakin ingin mengeluarkan <span className="text-white font-semibold">"{memberToRemove.name}"</span> ({memberToRemove.jabatan || 'Anggota'}) dari kepanitiaan program kerja ini?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const member = memberToRemove;
                  setMemberToRemove(null);
                  try {
                    // Find all user IDs in rawUsersList that share the same name and jabatan
                    const matchingIds = rawUsersList
                      .filter(u => 
                        u.name?.toLowerCase().trim() === member.name?.toLowerCase().trim() &&
                        u.jabatan?.toLowerCase().trim() === member.jabatan?.toLowerCase().trim()
                      )
                      .map(u => u.id);

                    const updatedMembers = (proker.members || []).filter(id => !matchingIds.includes(id));

                    // Update members array in Firestore
                    const docRef = doc(db, 'prokers', proker.id);
                    await updateDoc(docRef, {
                      members: updatedMembers
                    });

                    // Log activity
                    await addDoc(collection(db, 'activities'), {
                      type: 'proker_member_remove',
                      userName: currentProfile.name,
                      userRole: currentProfile.jabatan,
                      userPhoto: currentProfile.photoURL || '',
                      description: `mengeluarkan ${member.name} dari Kepanitiaan proker "${proker.name}"`,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    console.error(err);
                    setError('Gagal mengeluarkan anggota.');
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 px-4 text-sm font-semibold transition-all duration-200"
              >
                Ya, Keluarkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
