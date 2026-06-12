import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Lightbulb, Plus, Trash } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const COLOR_OPTIONS = [
  { value: '#fef08a', name: 'Kuning', text: 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200' },
  { value: '#bfdbfe', name: 'Biru', text: 'text-blue-800 bg-blue-100 hover:bg-blue-200' },
  { value: '#bbf7d0', name: 'Hijau', text: 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200' },
  { value: '#fbcfe8', name: 'Merah Muda', text: 'text-pink-800 bg-pink-100 hover:bg-pink-200' },
];

export default function Brainstorming({ proker }) {
  const { profile } = useAuth();
  const { data: notes, addItem: addNote, deleteItem: deleteNote } = 
    useProkerSubcollection(proker.id, 'brainstorming', 'createdAt', 'desc');

  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#fef08a');

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await addNote({
      text: text.trim(),
      color: selectedColor,
      author: profile.name,
      division: profile.divisi,
      date: new Date().toLocaleDateString('id-ID'),
    });

    setText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" /> Papan Curah Ide (Brainstorming)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Tuliskan ide, masukan, konsep, atau inovasi untuk keberhasilan {proker.name} di sini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sticky Note input Panel */}
        <div className="card p-6 self-start bg-surface-800/80">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tempel Ide Baru</h3>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Gagasan Ide</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis ide Anda secara singkat dan jelas..."
                className="input h-28 resize-none text-xs"
                maxLength={200}
                required
              />
              <span className="text-[10px] text-slate-500 block text-right mt-1">Maks. 200 karakter</span>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-2">Pilih Warna Sticky Note</label>
              <div className="flex gap-2.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-7 h-7 rounded-full transition-transform active:scale-90 ${selectedColor === c.value ? 'ring-2 ring-primary-500 scale-110 shadow-lg' : ''}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-xs flex justify-center mt-2">
              <Plus className="w-4 h-4" /> Tempelkan Ide
            </button>
          </form>
        </div>

        {/* Board Display */}
        <div className="lg:col-span-3">
          {notes.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-sm border-dashed border-white/10 flex flex-col items-center justify-center">
              <Lightbulb className="w-10 h-10 text-slate-600 mb-3" />
              <p>Belum ada ide yang ditempelkan.</p>
              <p className="text-xs text-slate-600 mt-1">Jadilah panitia pertama yang membagikan ide kreatif!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{ backgroundColor: note.color }}
                  className="rounded-2xl p-5 shadow-xl text-slate-800 min-h-[160px] flex flex-col justify-between relative group hover:scale-[1.02] hover:-rotate-1 transition-all duration-200 border border-black/5"
                >
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-3 right-3 p-1 text-black/40 hover:text-red-700 hover:bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus"
                  >
                    <Trash className="w-4 h-4" />
                  </button>

                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap pr-4 mb-4">
                    {note.text}
                  </p>

                  <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <span>{note.author} ({note.division})</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
