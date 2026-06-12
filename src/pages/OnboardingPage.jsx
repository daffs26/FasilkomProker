import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const BEM_DEPARTMENTS = {
  'BPH': {
    label: 'BPH (Pengurus Harian)',
    positions: ['Ketua BEM', 'Wakil Ketua BEM', 'Sekretaris 1', 'Sekretaris 2', 'Bendahara 1', 'Bendahara 2']
  },
  'PSDM': {
    label: 'PSDM (Pengembangan Sumber Daya Mahasiswa)',
    positions: ['Kadep PSDM', 'Kadiv PSDM Pengembangan', 'Kadiv PSDM Ristek', 'Anggota PSDM Pengembangan', 'Anggota PSDM Ristek']
  },
  'KOMINFO': {
    label: 'KOMINFO (Komunikasi & Informasi)',
    positions: ['Kadep Kominfo', 'Anggota Kominfo']
  },
  'PDD': {
    label: 'PDD (Publikasi, Dekorasi, Dokumentasi)',
    positions: ['Kadep PDD', 'Anggota PDD']
  },
  'ADVOKASI': {
    label: 'ADVOKASI (Advokasi & Kesejahteraan)',
    positions: ['Kadep Advokasi', 'Anggota Advokasi']
  },
  'MINAT BAKAT': {
    label: 'MINAT BAKAT (Minat & Bakat)',
    positions: ['Kadep Minat Bakat', 'Anggota Minat Bakat']
  },
  'SOSMAS': {
    label: 'SOSMAS (Sosial Masyarakat)',
    positions: ['Kadep Sosmas', 'Anggota Sosmas']
  }
};

export default function OnboardingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.displayName || '');
  const [jabatan, setJabatan] = useState('');
  const [divisi, setDivisi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect jika sudah lengkap
  if (user && profile) {
    navigate('/');
    return null;
  }

  const handleDivisiChange = (e) => {
    setDivisi(e.target.value);
    setJabatan('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Nama lengkap harus diisi.');
    if (!divisi) return setError('Pilih divisi Anda.');
    if (!jabatan) return setError('Pilih jabatan Anda.');

    setSubmitting(true);
    setError('');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        jabatan,
        divisi,
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      });
      // useAuth hook (onSnapshot) akan otomatis mendeteksi perubahan profile
      // dan App router akan otomatis me-redirect ke halaman utama (/)
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-700 shadow-2xl shadow-primary-900/50 mb-4">
            <span className="text-white font-bold text-2xl">FP</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lengkapi Profil Anda</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Sebelum masuk ke workspace BEM FASILKOM UMB, silakan tentukan peran Anda dalam kepanitiaan.
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Divisi / Departemen BEM
              </label>
              <select
                value={divisi}
                onChange={handleDivisiChange}
                className="select"
                required
              >
                <option value="" disabled>Pilih Divisi</option>
                {Object.entries(BEM_DEPARTMENTS).map(([key, data]) => (
                  <option key={key} value={key} className="bg-surface-800 text-slate-100">
                    {data.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Jabatan / Peran BEM
              </label>
              <select
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="select"
                disabled={!divisi}
                required
              >
                <option value="" disabled>Pilih Jabatan</option>
                {divisi && BEM_DEPARTMENTS[divisi]?.positions.map((opt) => (
                  <option key={opt} value={opt} className="bg-surface-800 text-slate-100">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-submit-profile"
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 flex justify-center text-base"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Simpan & Lanjutkan'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
