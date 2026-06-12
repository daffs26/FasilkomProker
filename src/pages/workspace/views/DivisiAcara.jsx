import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Clock, Plus, Trash } from 'lucide-react';

export default function DivisiAcara({ proker, profile }) {
  const canEdit = profile?.divisi === 'BPH' || profile?.divisi === 'PSDM' || profile?.divisi === 'MINAT BAKAT';

  // Subcollection for Rundown
  const { data: rundown, addItem: addRundown, deleteItem: deleteRundown } = 
    useProkerSubcollection(proker.id, 'rundown', 'time', 'asc');

  // Rundown Form
  const [runTime, setRunTime] = useState('');
  const [runAct, setRunAct] = useState('');
  const [runPic, setRunPic] = useState('');
  const [runNotes, setRunNotes] = useState('');

  // Submit Rundown
  const handleAddRundown = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!runTime.trim() || !runAct.trim() || !runPic.trim()) return;
    await addRundown({
      time: runTime.trim(),
      activity: runAct.trim(),
      pic: runPic.trim(),
      notes: runNotes.trim(),
    });
    setRunTime('');
    setRunAct('');
    setRunPic('');
    setRunNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="badge bg-primary-600/20 text-primary-400 border border-primary-500/20 mb-3">
          Divisi Acara
        </span>
        <h2 className="text-2xl font-bold text-white mb-1">Rundown Planner</h2>
        <p className="text-slate-400 text-sm">Kelola susunan acara dan jadwal rundown untuk program kerja ini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rundown List */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h4 className="font-bold text-white text-base">Jadwal Acara (Rundown)</h4>
            <span className="text-slate-400 text-xs">{rundown.length} Slot Acara</span>
          </div>
          <div className="p-6">
            {rundown.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Belum ada susunan acara rundown. Gunakan panel kanan untuk mengisi.
              </div>
            ) : (
              <div className="relative border-l-2 border-surface-600 ml-4 space-y-6">
                {rundown.map((item) => (
                  <div key={item.id} className="relative pl-6 group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary-600 border-4 border-surface-900" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-primary-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {item.time}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{item.activity}</h4>
                        <div className="text-xs text-slate-400 mt-1">
                          PIC: <span className="text-slate-300 font-semibold">{item.pic}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 italic mt-1.5 bg-surface-800/40 p-2 rounded-lg border border-white/5">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>

                      {canEdit ? (
                        <button
                          onClick={() => deleteRundown(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Rundown Form */}
        <div className="card p-6 self-start bg-surface-800">
          <h3 className="text-md font-bold text-white mb-4">Tambahkan Slot Acara</h3>
          <form onSubmit={handleAddRundown} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Durasi Waktu</label>
              <input
                type="text"
                value={runTime}
                onChange={(e) => setRunTime(e.target.value)}
                placeholder="Contoh: 08:30 - 09:00"
                className="input text-xs"
                disabled={!canEdit}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Nama Aktivitas</label>
              <input
                type="text"
                value={runAct}
                onChange={(e) => setRunAct(e.target.value)}
                placeholder="Contoh: Sambutan Ketua BEM"
                className="input text-xs"
                disabled={!canEdit}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Penanggung Jawab (PIC)</label>
              <input
                type="text"
                value={runPic}
                onChange={(e) => setRunPic(e.target.value)}
                placeholder="Contoh: Farhan / Divisi Acara"
                className="input text-xs"
                disabled={!canEdit}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                value={runNotes}
                onChange={(e) => setRunNotes(e.target.value)}
                placeholder="Contoh: Siapkan mic wireless cadangan"
                className="input h-20 resize-none text-xs"
                disabled={!canEdit}
              />
            </div>
            <button
              type="submit"
              disabled={!canEdit}
              className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Masukkan Rundown
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
