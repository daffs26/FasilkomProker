import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { useAuth } from '../../../hooks/useAuth';
import { FileText, Plus, Trash, ExternalLink, Search } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function DokumenProker({ proker, profile, user }) {
  const { data: documents, loading: loadingDocs, addItem: addDocItem, deleteItem: deleteDocItem } =
    useProkerSubcollection(proker.id, 'documents', 'createdAt', 'desc');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Proposal & LPJ Kegiatan');
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Local filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return setError('Nama dokumen wajib diisi.');
    }
    if (!file) {
      return setError('Silakan pilih dokumen untuk diunggah.');
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return setError('Ukuran file maksimal adalah 10 MB.');
    }

    setSubmitting(true);
    setError('');

    try {
      // Reference in storage
      const storageRef = ref(storage, `proker_documents/${proker.id}/${Date.now()}_${file.name}`);
      
      // Upload
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get URL
      const fileUrl = await getDownloadURL(uploadResult.ref);

      await addDocItem({
        name: name.trim(),
        category,
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        description: description.trim(),
        uploadedBy: profile.name,
        uploadedById: user.uid,
      });

      // Log activity
      try {
        await addDoc(collection(db, 'activities'), {
          type: 'proker_doc_upload',
          userName: profile.name,
          userRole: profile.jabatan,
          userPhoto: profile.photoURL || '',
          description: `mengunggah dokumen proker "${proker.name}": "${name.trim()}"`,
          createdAt: serverTimestamp(),
        });
      } catch (errLog) {
        console.error("Gagal mencatat log aktivitas:", errLog);
      }

      setName('');
      setFile(null);
      setDescription('');
      setCategory('Proposal & LPJ Kegiatan');
    } catch (err) {
      console.error(err);
      setError('Gagal mengunggah dokumen. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${docName}" dari proker ini?`)) {
      try {
        await deleteDocItem(docId);

        // Log activity
        try {
          await addDoc(collection(db, 'activities'), {
            type: 'proker_doc_delete',
            userName: profile.name,
            userRole: profile.jabatan,
            userPhoto: profile.photoURL || '',
            description: `menghapus dokumen proker "${proker.name}": "${docName}"`,
            createdAt: serverTimestamp(),
          });
        } catch (errLog) {
          console.error("Gagal mencatat log aktivitas:", errLog);
        }
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus dokumen.');
      }
    }
  };

  const filteredDocs = documents.filter((docItem) => {
    const matchesSearch =
      docItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docItem.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || docItem.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRelativeTime = (timestampString) => {
    if (!timestampString) return 'Baru saja';
    const date = new Date(timestampString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-400" /> Dokumen Proker
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Pusat penyimpanan dokumen kegiatan. Unggah proposal, LPJ, mockup desain, list sponsor, dan file lainnya di sini.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List of documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Category filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau deskripsi dokumen..."
                className="input pl-11 bg-surface-800"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              {['Semua', 'Proposal & LPJ Kegiatan', 'Rundown & Administrasi', 'Desain & Publikasi (PDD)', 'Sponsorship & Humas', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    selectedCategory === cat
                      ? 'bg-primary-600 border-primary-500 text-white shadow-lg'
                      : 'bg-surface-800 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-surface-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loadingDocs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card p-5 h-28 animate-pulse bg-surface-800/50" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center border-dashed border-white/10 bg-surface-800/30">
              <FileText className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-semibold text-white">Tidak ada dokumen proker</p>
              <p className="text-xs text-slate-400 mt-1">Belum ada dokumen yang sesuai dengan filter atau pencarian Anda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((item) => {
                const canDelete = item.uploadedById === user.uid || profile.divisi === 'BPH';
                return (
                  <div key={item.id} className="card p-5 bg-surface-800 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-base leading-snug truncate max-w-[250px] sm:max-w-[350px]" title={item.name}>
                            {item.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Diunggah oleh: <span className="text-slate-400">{item.uploadedBy}</span></span>
                          <span>•</span>
                          <span>{getRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteDocument(item.id, item.name)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Hapus Dokumen"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-surface-700 hover:bg-primary-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border border-white/5 hover:border-primary-500/20"
                      >
                        Buka <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Form to upload a document */}
        <div className="card p-6 self-start bg-surface-800 border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Unggah Dokumen Baru</h3>
            <p className="text-xs text-slate-400 mt-1">Unggah file dokumen langsung untuk diakses oleh pengurus BEM.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleAddDocument} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Nama Dokumen</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Lampiran Anggaran Divisi"
                className="input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Kategori Dokumen</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input py-2.5 bg-surface-800 border-white/10 text-slate-100 text-sm"
                required
              >
                <option value="Proposal & LPJ Kegiatan">Proposal & LPJ Kegiatan</option>
                <option value="Rundown & Administrasi">Rundown & Administrasi</option>
                <option value="Desain & Publikasi (PDD)">Desain & Publikasi (PDD)</option>
                <option value="Sponsorship & Humas">Sponsorship & Humas</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Pilih File Dokumen (Maks 10 MB)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="input text-sm file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
                required
              />
              {file && (
                <div className="text-xs text-slate-400 mt-2">
                  Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Deskripsi Singkat (Opsional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Berisi file spreadsheet untuk pengajuan RAB"
                className="input h-24 resize-none text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-xs flex justify-center items-center gap-1.5"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Simpan Dokumen
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
