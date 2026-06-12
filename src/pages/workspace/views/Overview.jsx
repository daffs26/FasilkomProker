import { useState, useEffect } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Megaphone, Calendar, MapPin, Users, Clock, Plus, Trash } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function Overview({ proker, updateProkerDetails }) {
  const { profile } = useAuth();
  const { data: announcements, addItem: addAnnouncement, deleteItem: deleteAnnouncement } = 
    useProkerSubcollection(proker.id, 'announcements', 'createdAt', 'desc');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Countdown timer
  useEffect(() => {
    if (!proker.date) return;
    const calculateTimeLeft = () => {
      const difference = +new Date(proker.date) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Hari H Pelaksanaan!');
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((difference / 1000 / 60) % 60);
      setTimeLeft(`${days} hari ${hours} jam ${mins} menit lagi`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [proker.date]);

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      author: profile.name,
      role: profile.jabatan,
    });

    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 bg-gradient-to-r from-primary-900/30 to-surface-800 flex flex-col justify-between">
          <div>
            <span className="badge bg-primary-600/20 text-primary-400 border border-primary-500/20 mb-3">
              Informasi Umum
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">{proker.name}</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{proker.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-white/5 pt-4">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-400" /> {proker.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary-400" /> {proker.location}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary-400" /> Est. {proker.estimatedAttendees} Peserta</span>
          </div>
        </div>

        {/* Countdown Card */}
        <div className="card p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-950/20 to-surface-800">
          <Clock className="w-8 h-8 text-primary-400 mb-3 animate-pulse-slow" />
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Hitung Mundur Acara</h3>
          <div className="text-xl font-extrabold text-white leading-tight tracking-tight mt-1">
            {timeLeft || 'Memuat...'}
          </div>
          <span className="text-xs text-slate-500 mt-2">Tanggal Pelaksanaan: {proker.date}</span>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-400" /> Pengumuman & Memo Internal
          </h3>

          {announcements.length === 0 ? (
            <div className="card p-8 text-center text-slate-400 text-sm">
              Belum ada pengumuman untuk kepanitiaan ini.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((item) => (
                <div key={item.id} className="card p-5 border-l-4 border-l-primary-500 bg-surface-800/60 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-base">{item.title}</h4>
                    {profile.divisi === 'BPH' && (
                      <button
                        onClick={() => deleteAnnouncement(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{item.content}</p>
                  <div className="text-slate-500 text-xs flex justify-between">
                    <span>Oleh: {item.author} ({item.role})</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Announcement Form */}
        <div className="card p-6 self-start">
          <h3 className="text-md font-bold text-white mb-4">Buat Pengumuman Baru</h3>
          <form onSubmit={handleAddAnnouncement} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Judul Memo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Pleno Akbar #2"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Isi Pengumuman</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan info lengkap rapat, deadline, atau instruksi kerja divisi..."
                className="input h-32 resize-none"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-xs flex justify-center">
              <Plus className="w-4 h-4" /> Kirim Pengumuman
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
