import { useState } from 'react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LogoBEM from '../assets/logo-bem.png';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Redirect jika sudah login
  if (user && profile) { navigate('/'); return null; }
  if (user && !profile) { navigate('/onboarding'); return null; }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Gagal masuk. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async (mockProfile) => {
    setLoading(true);
    setError('');
    try {
      // 1. Sign in anonymously to get a valid request.auth context
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;

      // 2. Set profile details in Firestore
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      await setDoc(doc(db, 'users', uid), {
        ...mockProfile,
        email: `${mockProfile.name.toLowerCase()}@bem.fasilkom`,
        photoURL: '',
        createdAt: new Date().toISOString()
      }, { merge: true });

      //useAuth will automatically subscribe to the new anonymous user and fetch their profile details
      navigate('/');
    } catch (err) {
      setError('Gagal masuk akun demo. Silakan aktifkan opsi "Anonymous" di Firebase Console -> Authentication -> Sign-in method agar fitur Demo Bypass dapat berfungsi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img src={LogoBEM} alt="BEM Fasilkom UMB" className="w-20 h-20 object-cover rounded-full border-2 border-white/10 mb-4 animate-pulse-slow" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Fasilkom Proker</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Platform manajemen program kerja<br />
            <span className="text-primary-400 font-medium">BEM FASILKOM Universitas Mercu Buana</span>
          </p>
        </div>

        {/* Card Login */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-2">Masuk ke Akun Anda</h2>
          <p className="text-slate-400 text-sm mb-8">
            Gunakan akun Google untuk mengakses platform BEM.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm leading-relaxed">
              {error}
            </div>
          )}

          <button
            id="btn-google-signin"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Memproses...' : 'Masuk dengan Google'}
          </button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Akun Demo</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleMockLogin(
                { name: 'Daffa', jabatan: 'Ketua BEM', divisi: 'BPH' }
              )}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 text-xs font-semibold rounded-xl border border-primary-500/20 transition-all active:scale-95"
            >
              Masuk sebagai BPH / Ketua BEM (Daffa)
            </button>
            <button
              onClick={() => handleMockLogin(
                { name: 'Fikri', jabatan: 'Kadep PSDM', divisi: 'PSDM' }
              )}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-500/20 transition-all active:scale-95"
            >
              Masuk sebagai Ketua Pelaksana (Fikri)
            </button>
            <button
              onClick={() => handleMockLogin(
                { name: 'Budi', jabatan: 'Anggota Kominfo', divisi: 'KOMINFO' }
              )}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl border border-white/5 transition-all active:scale-95"
            >
              Masuk sebagai Anggota Panitia (Budi)
            </button>
          </div>

          <p className="text-slate-500 text-[10px] text-center mt-6">
            Hanya anggota BEM FASILKOM UMB yang memiliki akses ke platform ini.
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Fasilkom Proker v1.0 · BEM FASILKOM UMB 2026
        </p>
      </div>
    </div>
  );
}
