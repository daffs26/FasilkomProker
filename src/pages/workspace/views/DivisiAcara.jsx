import { useState, useRef } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Clock, Plus, Trash, Map, Move, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const ITEM_TYPES = [
  { value: 'stage', label: 'Panggung Utama', color: 'bg-primary-600 border-primary-400' },
  { value: 'sound', label: 'Sound System', color: 'bg-yellow-600 border-yellow-400' },
  { value: 'table', label: 'Meja Registrasi / Logistik', color: 'bg-indigo-600 border-indigo-400' },
  { value: 'chair', label: 'Kursi VIP / Peserta', color: 'bg-emerald-600 border-emerald-400' },
];

export default function DivisiAcara({ proker }) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState('rundown');

  const canEdit = profile.divisi === 'BPH' || profile.divisi === 'PSDM' || profile.divisi === 'MINAT BAKAT';

  // Subcollections
  const { data: rundown, addItem: addRundown, deleteItem: deleteRundown } = 
    useProkerSubcollection(proker.id, 'rundown', 'time', 'asc');
  const { data: floorPlan, addItem: addFloorItem, deleteItem: deleteFloorItem } = 
    useProkerSubcollection(proker.id, 'floorPlan', 'createdAt', 'asc');

  // Rundown Form
  const [runTime, setRunTime] = useState('');
  const [runAct, setRunAct] = useState('');
  const [runPic, setRunPic] = useState('');
  const [runNotes, setRunNotes] = useState('');

  // Floor Plan Form
  const [selectedType, setSelectedType] = useState('stage');
  const [itemText, setItemText] = useState('');
  const canvasRef = useRef(null);

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

  // Click Canvas to Add Item
  const handleCanvasClick = async (e) => {
    if (!canEdit) return;
    if (!itemText.trim()) return alert('Masukkan label/nama barang terlebih dahulu sebelum meletakkannya di denah.');
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left - 15); // Adjust offset for icon center
    const y = Math.round(e.clientY - rect.top - 15);

    await addFloorItem({
      text: itemText.trim(),
      type: selectedType,
      x,
      y,
    });
    
    setItemText('');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('rundown')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'rundown' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Rundown Planner
        </button>
        <button
          onClick={() => setSubTab('floorplan')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'floorplan' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Layout Floor Plan
        </button>
      </div>

      {/* 1. RUNDOWN PLANNER */}
      {subTab === 'rundown' && (
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
      )}

      {/* 2. FLOOR PLAN CANVAS */}
      {subTab === 'floorplan' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toolbox */}
          <div className="card p-6 self-start bg-surface-800 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">1. Pilih Jenis Barang</h3>
              <div className="grid grid-cols-1 gap-2">
                {ITEM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedType(t.value)}
                    disabled={!canEdit}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedType === t.value ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-surface-700/30 border-white/5 text-slate-400 hover:bg-surface-700/50'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-md ${t.color.split(' ')[0]} border border-white/20`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">2. Beri Label / Nama</h3>
              <input
                type="text"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                placeholder="Contoh: Panggung Band"
                className="input text-xs"
                disabled={!canEdit}
              />
            </div>

            <div className="p-3 bg-surface-700/50 rounded-xl text-[10px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-0.5">Petunjuk:</span>
              {canEdit ? (
                'Ketik nama barang di atas, pilih jenisnya, lalu KLIK pada area denah di kanan untuk memposisikannya secara instan.'
              ) : (
                <span className="text-red-400 font-semibold">Anda tidak memiliki hak akses untuk mengedit denah lapangan. (Hanya BPH, PSDM, & Minat Bakat).</span>
              )}
            </div>
          </div>

          {/* Denah Canvas */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Map className="w-5 h-5 text-primary-400" /> Kanvas Tata Letak Lapangan (D-Day Layout)
              </h3>
              <span className="text-slate-500 text-xs">{floorPlan.length} Barang dipasang</span>
            </div>

            {/* Visual Grid Map Canvas */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`w-full h-[400px] relative bg-surface-950 rounded-3xl overflow-hidden border border-white/5 shadow-inner ${canEdit ? 'cursor-crosshair' : 'cursor-not-allowed opacity-80'}`}
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {floorPlan.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-center p-6 pointer-events-none">
                  <LayoutGrid className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">Kanvas Kosong</p>
                  <p className="text-xs max-w-xs mt-1">Ketik nama di kiri lalu klik di sini untuk menempatkan panggung, sound system, meja registrasi, atau kursi.</p>
                </div>
              ) : (
                floorPlan.map((item) => {
                  const typeObj = ITEM_TYPES.find((t) => t.value === item.type);
                  const colorClass = typeObj ? typeObj.color : 'bg-slate-600';
                  return (
                    <div
                      key={item.id}
                      style={{ left: `${item.x}px`, top: `${item.y}px` }}
                      className={`absolute px-3 py-1.5 rounded-lg border text-[10px] font-bold text-white ${colorClass} flex items-center gap-1.5 shadow-lg group cursor-pointer active:scale-95`}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop parent canvas click trigger
                        if (!canEdit) return;
                        if (window.confirm(`Hapus ${item.text} dari denah?`)) deleteFloorItem(item.id);
                      }}
                      title={canEdit ? 'Klik untuk menghapus barang' : ''}
                    >
                      <span>{item.text}</span>
                      {canEdit && <Trash className="w-3 h-3 text-white/50 group-hover:text-red-300 transition-colors" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
