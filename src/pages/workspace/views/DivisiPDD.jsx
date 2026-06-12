import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Image, Check, Clock, Plus, Trash, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function DivisiPDD({ proker, profile }) {
  const [subTab, setSubTab] = useState('calendar');

  const canEdit = profile?.divisi === 'BPH' || profile?.divisi === 'PDD' || profile?.divisi === 'KOMINFO';
  const canApprove = profile?.divisi === 'BPH' || profile?.jabatan === 'Kadep PDD';

  // Subcollections
  const { data: calendar, addItem: addCalItem, updateItem: updateCalItem, deleteItem: deleteCalItem } = 
    useProkerSubcollection(proker.id, 'pddCalendar', 'createdAt', 'asc');
  const { data: designs, addItem: addDesign, updateItem: updateDesign, deleteItem: deleteDesign } = 
    useProkerSubcollection(proker.id, 'designs', 'createdAt', 'desc');

  // Calendar Form
  const [calTask, setCalTask] = useState('');
  const [calDeadline, setCalDeadline] = useState('');

  // Design Mock Upload Form
  const [dTitle, setDTitle] = useState('');
  const [dFile, setDFile] = useState('');
  const [dSize, setDSize] = useState('1.5 MB');

  // Submit Calendar Task
  const handleAddCal = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!calTask.trim() || !calDeadline) return;
    await addCalItem({
      task: calTask.trim(),
      deadline: calDeadline,
      status: 'Pending',
    });
    setCalTask('');
    setCalDeadline('');
  };

  // Toggle Calendar Task Status
  const handleToggleCal = async (item) => {
    if (!canEdit) return;
    const nextStatus = item.status === 'Done' ? 'Pending' : 'Done';
    await updateCalItem(item.id, { status: nextStatus });
  };

  // Mock Upload Design Info
  const handleAddDesignMock = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!dTitle.trim() || !dFile.trim()) return;
    await addDesign({
      title: dTitle.trim(),
      file: dFile.trim(),
      size: dSize,
      acc: false,
      date: new Date().toLocaleDateString('id-ID'),
    });
    setDTitle('');
    setDFile('');
  };

  // Toggle Design ACC (Approved)
  const handleToggleAcc = async (item) => {
    if (!canApprove) return;
    await updateDesign(item.id, { acc: !item.acc });
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('calendar')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'calendar' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Kalender Publikasi & Desain
        </button>
        <button
          onClick={() => setSubTab('designs')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'designs' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          File Approval Desain
        </button>
      </div>

      {/* 1. KALENDER PUBLIKASI */}
      {subTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Timeline Kerja Publikasi & Dekorasi</h4>
              <span className="text-slate-400 text-xs">{calendar.length} Task terdaftar</span>
            </div>
            <div className="p-6 space-y-4">
              {calendar.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Belum ada tugas kalender kerja. Tambahkan di panel kanan.
                </div>
              ) : (
                <div className="space-y-3">
                  {calendar.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3.5 bg-surface-700/20 border border-white/5 rounded-2xl hover:bg-surface-700/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleCal(item)}
                          disabled={!canEdit}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${item.status === 'Done' ? 'bg-primary-600 border-primary-500 text-white' : 'border-white/20 hover:border-primary-500'}`}
                          title="Klik untuk menyelesaikan tugas"
                        >
                          {item.status === 'Done' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <p className={`text-sm ${item.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.task}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary-400" /> Deadline: {item.deadline}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => deleteCalItem(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="card p-6 self-start bg-surface-800">
            <h3 className="text-md font-bold text-white mb-4">Tambahkan Target Publikasi</h3>
            <form onSubmit={handleAddCal} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Tugas / Kebutuhan Desain</label>
                <input
                  type="text"
                  value={calTask}
                  onChange={(e) => setCalTask(e.target.value)}
                  placeholder="Contoh: Rilis Pamflet Pendaftaran Acara"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Tanggal Deadline</label>
                <input
                  type="date"
                  value={calDeadline}
                  onChange={(e) => setCalDeadline(e.target.value)}
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Masukkan Kalender
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. DESIGN APPROVAL MOCK */}
      {subTab === 'designs' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mock Upload Form */}
          <div className="card p-6 self-start bg-surface-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Simulasikan Upload Desain</h3>
            <form onSubmit={handleAddDesignMock} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama / Judul Desain</label>
                <input
                  type="text"
                  value={dTitle}
                  onChange={(e) => setDTitle(e.target.value)}
                  placeholder="Contoh: Banner Backdrop Panggung"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama File Desain</label>
                <input
                  type="text"
                  value={dFile}
                  onChange={(e) => setDFile(e.target.value)}
                  placeholder="Contoh: backdrop_pemilwa_v2.png"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Ukuran File</label>
                <select
                  value={dSize}
                  onChange={(e) => setDSize(e.target.value)}
                  className="select text-xs"
                  disabled={!canEdit}
                >
                  <option value="1.2 MB">1.2 MB</option>
                  <option value="2.8 MB">2.8 MB</option>
                  <option value="4.5 MB">4.5 MB</option>
                  <option value="8.0 MB">8.0 MB</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Upload Info Desain
              </button>
            </form>
          </div>

          {/* Design List */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-emerald-400" /> Pusat Persetujuan Karya Desain (ACC)
            </h3>

            {designs.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                Belum ada berkas rancangan desain yang diunggah untuk persetujuan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {designs.map((item) => (
                  <div key={item.id} className="card p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">{item.title}</h4>
                        {canEdit && (
                          <button
                            onClick={() => deleteDesign(item.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-surface-700/30 rounded-xl flex items-center gap-3 border border-white/5 mb-4 mt-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold uppercase">
                          IMG
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-slate-200 truncate">{item.file}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.size} · Uploaded: {item.date}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500 italic">
                        Status ACC: {item.acc ? <span className="text-emerald-400 font-bold">APPROVED</span> : <span className="text-yellow-500 font-bold">WAITING BPH</span>}
                      </span>
                      
                      <button
                        onClick={() => handleToggleAcc(item)}
                        disabled={!canApprove}
                        className={`btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1 ${item.acc ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-surface-700 hover:bg-surface-600 text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Hanya BPH atau Kadep PDD yang dapat memberi ACC"
                      >
                        {item.acc ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> ACC Aktif
                          </>
                        ) : (
                          'Beri ACC'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
