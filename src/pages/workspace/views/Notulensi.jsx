import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { FileText, Plus, Trash, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function Notulensi({ proker }) {
  const { profile } = useAuth();
  const { data: minutes, addItem: addMinutes, deleteItem: deleteMinutes } = 
    useProkerSubcollection(proker.id, 'notulensi', 'createdAt', 'desc');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const handleAddMinutes = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !content.trim()) return;

    await addMinutes({
      title: title.trim(),
      date,
      content: content.trim(),
      author: profile.name,
      role: profile.jabatan,
    });

    setTitle('');
    setDate('');
    setContent('');
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Notulensi Rapat
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Simpan hasil rapat pleno, rapat koordinasi divisi, maupun evaluasi di sini agar terdokumentasi dengan baik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notulen List */}
        <div className="lg:col-span-2 space-y-4">
          {minutes.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-sm">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p>Belum ada notulensi rapat yang diunggah.</p>
              <p className="text-xs text-slate-600 mt-1">Gunakan panel kanan untuk membuat catatan rapat perdana.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {minutes.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id} className="card overflow-hidden">
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">{item.title}</h4>
                          <span className="text-slate-400 text-xs mt-1 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {profile.divisi === 'BPH' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Hapus notulensi ini?')) deleteMinutes(item.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-surface-800/40 animate-fade-in">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.content}
                        </p>
                        <div className="border-t border-white/5 mt-4 pt-3 text-[10px] text-slate-500 flex justify-between">
                          <span>Ditulis oleh: {item.author} ({item.role})</span>
                          <span>Terakhir diupdate: {new Date(item.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Notulen Form */}
        <div className="card p-6 self-start bg-surface-800">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Buat Notulen Rapat Baru</h3>
          <form onSubmit={handleAddMinutes} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Judul / Agenda Rapat</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi BPH & Koor"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Tanggal Rapat</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Hasil & Rincian Rapat</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan butir-butir keputusan rapat secara rinci, tugas per divisi, dan jadwal tindak lanjut..."
                className="input h-44 resize-none text-xs"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-xs flex justify-center">
              <Plus className="w-4 h-4" /> Simpan Notulensi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
