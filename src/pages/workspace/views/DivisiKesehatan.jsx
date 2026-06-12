import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Heart, Plus, Trash, CheckCircle2, XCircle, ShieldAlert, Phone } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const EMERGENCY_CONTACTS = [
  { name: 'UGD RS Mitra Keluarga Kalideres', phone: '(021) 5459000', note: 'Rumah sakit rujukan terdekat' },
  { name: 'Ambulans Gawat Darurat (AGD) DKI', phone: '112 / 119', note: 'Layanan medis darurat utama' },
  { name: 'Keamanan Kampus UMB (Meruya)', phone: '(021) 5840816', note: 'Pos Satpam gerbang utama' },
];

export default function DivisiKesehatan({ proker }) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState('stock');

  // Subcollections
  const { data: medicine, addItem: addMedItem, updateItem: updateMedItem, deleteItem: deleteMedItem } = 
    useProkerSubcollection(proker.id, 'medicine', 'createdAt', 'asc');
  const { data: medicalLogs, addItem: addMedicalLog, deleteItem: deleteMedicalLog } = 
    useProkerSubcollection(proker.id, 'medicalLogs', 'createdAt', 'desc');

  // Medicine Form
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');

  // Medical Log Form
  const [patientName, setPatientName] = useState('');
  const [patientIssue, setPatientIssue] = useState('');
  const [patientAction, setPatientAction] = useState('');

  // Submit Medicine
  const handleAddMed = async (e) => {
    e.preventDefault();
    if (!medName.trim() || !medStock.trim()) return;
    await addMedItem({
      name: medName.trim(),
      stock: medStock.trim(),
      status: 'Tersedia',
    });
    setMedName('');
    setMedStock('');
  };

  // Toggle Medicine Status
  const handleToggleMedStatus = async (item) => {
    if (profile.divisi !== 'Kesehatan' && profile.divisi !== 'BPH') return;
    const nextStatus = item.status === 'Tersedia' ? 'Kurang' : 'Tersedia';
    await updateMedItem(item.id, { status: nextStatus });
  };

  // Submit Log
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientIssue.trim() || !patientAction.trim()) return;
    
    await addMedicalLog({
      name: patientName.trim(),
      issue: patientIssue.trim(),
      action: patientAction.trim(),
      date: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    });

    setPatientName('');
    setPatientIssue('');
    setPatientAction('');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('stock')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'stock' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Checklist Obat & P3K
        </button>
        <button
          onClick={() => setSubTab('logs')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'logs' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Log Penanganan Pasien
        </button>
      </div>

      {/* 1. STOCK CHECKLIST */}
      {subTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Kotak Obat & Inventaris Medis</h4>
              <span className="text-slate-400 text-xs">{medicine.length} Obat terdaftar</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-surface-700/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Nama Obat / Alat Medis</th>
                    <th className="px-6 py-4 text-center">Jumlah Stok</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {medicine.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-500 text-xs">
                        Belum ada stok obat terdaftar. Gunakan panel kanan untuk mengisi.
                      </td>
                    </tr>
                  ) : (
                    medicine.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{item.name}</td>
                        <td className="px-6 py-4 text-center text-xs font-mono font-bold text-slate-300">{item.stock}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleMedStatus(item)}
                            className={`badge gap-1 cursor-pointer select-none ${item.status === 'Tersedia' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            disabled={profile.divisi !== 'Kesehatan' && profile.divisi !== 'BPH'}
                            title="Klik untuk mengubah status (Koor Kesehatan/BPH)"
                          >
                            {item.status === 'Tersedia' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Tersedia
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Kurang / Habis
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {profile.divisi === 'Kesehatan' || profile.divisi === 'BPH' ? (
                            <button
                              onClick={() => deleteMedItem(item.id)}
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

          {/* Form and Emergency list */}
          <div className="space-y-6">
            {/* Add stock */}
            <div className="card p-6 bg-surface-800">
              <h3 className="text-md font-bold text-white mb-4">Tambah Stok Obat</h3>
              <form onSubmit={handleAddMed} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Nama Obat / Kebutuhan</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="Contoh: Paracetamol 500mg"
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Kapasitas Stok</label>
                  <input
                    type="text"
                    value={medStock}
                    onChange={(e) => setMedStock(e.target.value)}
                    placeholder="Contoh: 2 Box / 3 Pcs"
                    className="input text-xs"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2">
                  <Plus className="w-4 h-4" /> Tambah Obat
                </button>
              </form>
            </div>

            {/* Emergency Contacts */}
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-red-500" /> Kontak Darurat UGD
              </h3>
              <div className="space-y-3">
                {EMERGENCY_CONTACTS.map((c) => (
                  <div key={c.name} className="p-3 bg-surface-700/30 rounded-xl border border-white/5">
                    <div className="text-xs font-bold text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.note}</div>
                    <a
                      href={`tel:${c.phone}`}
                      className="text-red-400 hover:underline flex items-center gap-1 font-semibold text-xs mt-2"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call: {c.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOG PENANGANAN PASIEN */}
      {subTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 animate-pulse-slow" /> Buku Log Kesehatan Lapangan
              </h4>
              <span className="text-slate-400 text-xs">{medicalLogs.length} Kasus tercatat</span>
            </div>
            <div className="p-6 space-y-4">
              {medicalLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Belum ada laporan keluhan kesehatan.
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-surface-800 rounded-2xl border border-white/5 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">{log.name}</h4>
                        <span className="text-slate-500 text-[10px]">{log.date}</span>
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div><span className="text-slate-500">Keluhan:</span> {log.issue}</div>
                        <div><span className="text-slate-500">Tindakan:</span> {log.action}</div>
                      </div>
                      {(profile.divisi === 'Kesehatan' || profile.divisi === 'BPH') && (
                        <button
                          onClick={() => deleteMedicalLog(log.id)}
                          className="absolute bottom-3 right-3 p-1 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus"
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
            <h3 className="text-md font-bold text-white mb-4">Catat Pasien Baru</h3>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Pasien (Panitia/Peserta)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Contoh: Rian (Staff Acara)"
                  className="input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Keluhan / Gejala Sakit</label>
                <input
                  type="text"
                  value={patientIssue}
                  onChange={(e) => setPatientIssue(e.target.value)}
                  placeholder="Contoh: Sakit kepala / Lemas pingsan"
                  className="input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Tindakan Pertolongan</label>
                <textarea
                  value={patientAction}
                  onChange={(e) => setPatientAction(e.target.value)}
                  placeholder="Contoh: Istirahat di UKS & diberi air hangat + Parasetamol"
                  className="input h-20 resize-none text-xs"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2">
                <Plus className="w-4 h-4" /> Simpan Log Medis
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
