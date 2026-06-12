import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Flame, Check, Plus, Trash, ShieldAlert, AlertOctagon, HelpCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function DDay({ proker, profile, updateProkerDetails }) {

  // Subcollection for D-Day checklist
  const { data: checklist, addItem: addChecklistItem, updateItem: updateChecklistItem, deleteItem: deleteChecklistItem } = 
    useProkerSubcollection(proker.id, 'ddayChecklist', 'createdAt', 'asc');

  // Checklist Form
  const [taskText, setTaskText] = useState('');

  // Panic Form
  const [panicDesc, setPanicDesc] = useState('');
  const [isActivatingPanic, setIsActivatingPanic] = useState(false);

  // Trigger Panic Active
  if (!profile) return null;

  const handleTriggerPanic = async (e) => {
    e.preventDefault();
    if (!panicDesc.trim()) return;
    
    try {
      await updateProkerDetails({
        panicActive: true,
        panicReport: {
          description: panicDesc.trim(),
          reporterName: profile.name,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        }
      });
      setPanicDesc('');
      setIsActivatingPanic(false);
      
      // Optional sound alert mock
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 800);
      } catch (audioErr) {
        console.warn("AudioContext block by browser auto-play policy:", audioErr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Panic Active
  const handleResolvePanic = async () => {
    try {
      await updateProkerDetails({
        panicActive: false,
        panicReport: null
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Checklist
  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    await addChecklistItem({
      task: taskText.trim(),
      status: 'Pending',
    });
    setTaskText('');
  };

  // Toggle Checklist Status
  const handleToggleChecklist = async (item) => {
    const nextStatus = item.status === 'Done' ? 'Pending' : 'Done';
    await updateChecklistItem(item.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* PANIC BUTTON ZONE */}
      <div className="card p-6 border-red-500/20 bg-surface-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" /> Tombol Keadaan Darurat Lapangan (Panic Button)
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Gunakan tombol ini HANYA jika terjadi keadaan darurat kritis di lapangan (korsleting, kericuhan, kecelakaan berat). Mengaktifkan tombol ini akan memunculkan banner peringatan merah berkedip di seluruh layar panitia yang sedang mengakses sistem.
        </p>

        {proker.panicActive ? (
          <div className="p-6 bg-red-950/40 border-2 border-red-500 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse-slow">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/50">
                <Flame className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="font-black text-red-400 text-base">⚠️ STATUS GAWAT DARURAT SEDANG AKTIF!</h4>
                <p className="text-white font-semibold text-sm mt-1">{proker.panicReport?.description}</p>
                <span className="text-slate-400 text-xs mt-1 block">
                  Dilaporkan oleh: <span className="text-slate-300 font-bold">{proker.panicReport?.reporterName}</span> pukul {proker.panicReport?.time}
                </span>
              </div>
            </div>

            <button
              onClick={handleResolvePanic}
              className="btn-danger bg-red-700 hover:bg-red-600 text-white font-bold px-6 py-3 shrink-0 flex items-center gap-2 active:scale-95 transition-all rounded-xl shadow-lg shadow-red-900/40"
            >
              <Check className="w-5 h-5" /> Selesaikan Kondisi Darurat
            </button>
          </div>
        ) : (
          <div>
            {!isActivatingPanic ? (
              <button
                onClick={() => setIsActivatingPanic(true)}
                className="btn-danger w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 rounded-xl"
              >
                <Flame className="w-5 h-5" /> Aktifkan Laporan Darurat
              </button>
            ) : (
              <form onSubmit={handleTriggerPanic} className="space-y-4 max-w-xl animate-fade-in p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mt-4">
                <div>
                  <label className="block text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Deskripsi Masalah Lapangan</label>
                  <textarea
                    value={panicDesc}
                    onChange={(e) => setPanicDesc(e.target.value)}
                    placeholder="Contoh: Korsleting listrik pada sound system utama dekat panggung, butuh pemadaman & teknisi..."
                    className="input border-red-500/20 focus:ring-red-500 h-24 resize-none"
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="btn-danger bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2"
                  >
                    Kirim Peringatan Bahaya
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActivatingPanic(false)}
                    className="btn-secondary text-xs px-4 py-2 border-white/10 text-slate-300"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* RUNDOWN & DDAY CHECKLIST ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D-Day Coordinator Checklist */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h4 className="font-bold text-white text-base">Checklist Koordinasi Lapangan H-H</h4>
            <span className="text-slate-400 text-xs">{checklist.length} Tugas Lapangan</span>
          </div>
          <div className="p-6 space-y-4">
            {checklist.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Belum ada checklist koordinasi lapangan H-H. Tambahkan di panel kanan.
              </div>
            ) : (
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3.5 bg-surface-700/20 border border-white/5 rounded-2xl hover:bg-surface-700/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleChecklist(item)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${item.status === 'Done' ? 'bg-primary-600 border-primary-500 text-white' : 'border-white/20 hover:border-primary-500'}`}
                      >
                        {item.status === 'Done' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <p className={`text-sm ${item.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.task}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Checklist form */}
        <div className="card p-6 self-start bg-surface-800">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tambah Checklist Lapangan</h3>
          <form onSubmit={handleAddChecklist} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Nama Tugas Lapangan</label>
              <textarea
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="Contoh: Briefing panitia inti jam 07.00 di gazebo utama..."
                className="input h-24 resize-none text-xs"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs">
              <Plus className="w-4 h-4" /> Tambah Checklist
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
