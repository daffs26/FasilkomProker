import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import WorkspaceLayout from './pages/workspace/WorkspaceLayout';
import LogoBEM from './assets/logo-bem.png';

import { ShieldAlert, Smartphone, LogOut } from 'lucide-react';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OnboardedRoute({ children }) {
  const { user, profile, loading, deviceBlocked, resetDevices, logout } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;
  if (deviceBlocked) return <DeviceBlockedScreen resetDevices={resetDevices} logout={logout} />;
  return children;
}

function DeviceBlockedScreen({ resetDevices, logout }) {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 shadow-2xl shadow-red-950/40 mb-4 animate-bounce">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Batas Perangkat Terlampaui</h1>
          <p className="text-slate-400 mt-2 text-xs leading-relaxed">
            Keamanan Data Kepanitiaan BEM FASILKOM Universitas Mercu Buana
          </p>
        </div>

        {/* Content Card */}
        <div className="card p-8 bg-surface-800 border border-red-500/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-2xl text-red-400 text-xs mb-6 leading-relaxed">
            <Smartphone className="w-8 h-8 shrink-0 text-red-400 animate-pulse" />
            <span>
              Akun Anda sedang digunakan di <strong>2 perangkat aktif lain</strong>. Demi keamanan, setiap pengurus dibatasi maksimal menggunakan 2 perangkat bersamaan.
            </span>
          </div>

          <div className="space-y-4">
            <button
              onClick={resetDevices}
              className="btn-primary w-full py-3.5 flex justify-center text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border-0 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 text-white"
            >
              Keluarkan Semua Perangkat Lain
            </button>

            <button
              onClick={logout}
              className="btn-secondary w-full py-3 flex justify-center items-center gap-2 text-xs font-semibold hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun (Logout)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src={LogoBEM} alt="BEM Fasilkom UMB" className="w-16 h-16 object-cover rounded-full border-2 border-white/10 animate-pulse" />
        <p className="text-slate-400 text-sm">Memuat Fasilkom Proker...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={
          <PrivateRoute><OnboardingPage /></PrivateRoute>
        } />
        <Route path="/" element={
          <OnboardedRoute><HomePage /></OnboardedRoute>
        } />
        <Route path="/proker/:id/*" element={
          <OnboardedRoute><WorkspaceLayout /></OnboardedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
