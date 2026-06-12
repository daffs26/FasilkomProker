import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Package, Star, Plus, Trash, CheckCircle2, XCircle, Phone, FileText } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';

export default function DivisiPerlap({ proker, profile }) {
  const [subTab, setSubTab] = useState('inventory');

  const canEdit = profile?.divisi === 'BPH' || profile?.divisi === 'MINAT BAKAT';

  // Subcollections
  const { data: inventory, addItem: addInvItem, updateItem: updateInvItem, deleteItem: deleteInvItem } = 
    useProkerSubcollection(proker.id, 'inventory', 'createdAt', 'asc');
  const { data: vendors, addItem: addVendor, deleteItem: deleteVendor } = 
    useProkerSubcollection(proker.id, 'vendors', 'createdAt', 'asc');

  // Inventory Form
  const [invItem, setInvItem] = useState('');
  const [invQty, setInvQty] = useState('');
  const [invSource, setInvSource] = useState('peminjaman BSP');
  const [invPic, setInvPic] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Vendor Form
  const [vName, setVName] = useState('');
  const [vService, setVService] = useState('');
  const [vContact, setVContact] = useState('');
  const [vRating, setVRating] = useState('5');

  // Add Inventory Item
  const handleAddInv = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!invItem.trim() || !invQty || !invPic.trim()) return;

    let docUrl = '';
    let docName = '';

    if (invSource === 'sewa' || invSource === 'beli baru') {
      if (!proofFile) {
        alert('Mohon pilih file bukti dokumen.');
        return;
      }
      setUploading(true);
      try {
        const storageRef = ref(storage, `proker_documents/${proker.id}/perlap/${Date.now()}_${proofFile.name}`);
        const uploadResult = await uploadBytes(storageRef, proofFile);
        docUrl = await getDownloadURL(uploadResult.ref);
        docName = proofFile.name;
      } catch (err) {
        console.error(err);
        alert('Gagal mengunggah file bukti dokumen.');
        setUploading(false);
        return;
      }
    }

    await addInvItem({
      item: invItem.trim(),
      quantity: parseInt(invQty) || 1,
      source: invSource,
      status: 'Belum Ada',
      pic: invPic.trim(),
      docUrl: docUrl || null,
      docName: docName || null,
    });
    setInvItem('');
    setInvQty('');
    setInvPic('');
    setProofFile(null);
    setUploading(false);
  };

  // Toggle Inventory Status
  const handleToggleInvStatus = async (item) => {
    if (!canEdit) return;
    const nextStatus = item.status === 'Sudah Ada' ? 'Belum Ada' : 'Sudah Ada';
    await updateInvItem(item.id, { status: nextStatus });
  };

  // Add Vendor
  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!vName.trim() || !vService.trim() || !vContact.trim()) return;
    await addVendor({
      name: vName.trim(),
      service: vService.trim(),
      contact: vContact.trim(),
      rating: parseInt(vRating) || 5,
    });
    setVName('');
    setVService('');
    setVContact('');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('inventory')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'inventory' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Checklist Logistik & Alat
        </button>
        <button
          onClick={() => setSubTab('vendors')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'vendors' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Rekomendasi Vendor
        </button>
      </div>

      {/* 1. INVENTORY CHECKLIST */}
      {subTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Table List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Checklist Perlengkapan Utama</h4>
              <span className="text-slate-400 text-xs">{inventory.length} Barang terdaftar</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-surface-700/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Nama Alat / Perlengkapan</th>
                    <th className="px-4 py-4 text-center">Qty</th>
                    <th className="px-4 py-4">Asal Barang</th>
                    <th className="px-4 py-4">PIC</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500 text-xs">
                        Belum ada daftar barang yang dimasukkan.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{item.item}</td>
                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                        <td className="px-4 py-4 text-xs text-slate-400">
                          <div className="capitalize">{item.source}</div>
                          {item.docUrl && (
                            <a
                              href={item.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:underline flex items-center gap-1 mt-1 text-[10px]"
                            >
                              <FileText className="w-3.5 h-3.5" /> Bukti Audit
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-300">{item.pic}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleInvStatus(item)}
                            className={`badge gap-1 cursor-pointer select-none ${item.status === 'Sudah Ada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            disabled={!canEdit}
                            title="Klik untuk mengubah status (Koor Perlap/BPH)"
                          >
                            {item.status === 'Sudah Ada' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Sudah Ada
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Belum Ada
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {canEdit ? (
                            <button
                              onClick={() => deleteInvItem(item.id)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="card p-6 self-start bg-surface-800">
            <h3 className="text-md font-bold text-white mb-4">Daftarkan Alat Baru</h3>
            <form onSubmit={handleAddInv} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Alat / Kebutuhan</label>
                <input
                  type="text"
                  value={invItem}
                  onChange={(e) => setInvItem(e.target.value)}
                  placeholder="Contoh: Kabel Roll 10m"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(e.target.value)}
                    placeholder="Contoh: 4"
                    className="input text-xs"
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Asal / Sumber</label>
                  <select
                    value={invSource}
                    onChange={(e) => setInvSource(e.target.value)}
                    className="select text-xs"
                    disabled={!canEdit}
                  >
                    <option value="peminjaman BSP">peminjaman BSP</option>
                    <option value="sewa">sewa</option>
                    <option value="beli baru">beli baru</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Penanggung Jawab (PIC)</label>
                <input
                  type="text"
                  value={invPic}
                  onChange={(e) => setInvPic(e.target.value)}
                  placeholder="Contoh: Bagas Aditya"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              {(invSource === 'sewa' || invSource === 'beli baru') && (
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Upload Bukti Dokumen (Maks 10 MB)</label>
                  <input
                    type="file"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    className="input text-xs file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
                    disabled={!canEdit || uploading}
                    required
                  />
                  {proofFile && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      File: {proofFile.name} ({(proofFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={!canEdit || uploading}
                className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengunggah Bukti...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Masukkan Daftar Alat
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. VENDOR DIRECTORY */}
      {subTab === 'vendors' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vendor Add Form */}
          <div className="card p-6 self-start bg-surface-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Tambah Data Vendor</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Vendor</label>
                <input
                  type="text"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="Contoh: SewaHT Malang"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Layanan / Jasa</label>
                <input
                  type="text"
                  value={vService}
                  onChange={(e) => setVService(e.target.value)}
                  placeholder="Contoh: Katering / Sound System"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Kontak Person</label>
                <input
                  type="text"
                  value={vContact}
                  onChange={(e) => setVContact(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Rating Kualitas</label>
                <select
                  value={vRating}
                  onChange={(e) => setVRating(e.target.value)}
                  className="select text-xs"
                  disabled={!canEdit}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Sangat Bagus)</option>
                  <option value="4">⭐⭐⭐⭐ (Bagus)</option>
                  <option value="3">⭐⭐⭐ (Cukup)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Simpan Vendor
              </button>
            </form>
          </div>

          {/* Directory Grid */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-400" /> Direktori Vendor & Rekanan
            </h3>

            {vendors.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                Belum ada data vendor rekanan yang didaftarkan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendors.map((v) => (
                  <div key={v.id} className="card p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-base">{v.name}</h4>
                        {canEdit ? (
                          <button
                            onClick={() => deleteVendor(v.id)}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                      <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] mb-4">
                        {v.service}
                      </span>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs mt-4">
                      <a
                        href={`tel:${v.contact}`}
                        className="text-primary-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" /> {v.contact}
                      </a>
                      <div className="flex text-yellow-500">
                        {Array.from({ length: v.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
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
