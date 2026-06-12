import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Share2, DollarSign, Plus, Trash, Check, MessageSquare, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function DivisiHumas({ proker }) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState('sponsorship');

  const canEdit = profile.divisi === 'BPH' || profile.divisi === 'KOMINFO' || profile.divisi === 'SOSMAS';

  const canToggleObligation = (item) => {
    if (profile.divisi === 'BPH') return true;
    if (item.division === 'PDD') return profile.divisi === 'PDD' || profile.divisi === 'KOMINFO';
    if (item.division === 'Perlengkapan') return profile.divisi === 'MINAT BAKAT';
    if (item.division === 'Acara') return profile.divisi === 'PSDM' || profile.divisi === 'MINAT BAKAT';
    if (item.division === 'Humas') return profile.divisi === 'KOMINFO' || profile.divisi === 'SOSMAS';
    return false;
  };

  // Subcollections
  const { data: sponsorships, addItem: addSponsor, updateItem: updateSponsor, deleteItem: deleteSponsor } = 
    useProkerSubcollection(proker.id, 'sponsorships', 'createdAt', 'asc');
  const { data: mediaPartners, addItem: addMedpart, deleteItem: deleteMedpart } = 
    useProkerSubcollection(proker.id, 'mediaPartners', 'createdAt', 'asc');
  const { data: obligations, addItem: addObligation, updateItem: updateObligation, deleteItem: deleteObligation } = 
    useProkerSubcollection(proker.id, 'obligations', 'createdAt', 'asc');

  // Sponsorship Form
  const [spName, setSpName] = useState('');
  const [spContact, setSpContact] = useState('');
  const [spPackage, setSpPackage] = useState('Silver');
  const [spAmount, setSpAmount] = useState('');
  const [spStatus, setSpStatus] = useState('Negosiasi');

  // Medpart Form
  const [mpName, setMpName] = useState('');
  const [mpContact, setMpContact] = useState('');
  const [mpStatus, setMpStatus] = useState('Negosiasi');

  // Obligations Form
  const [obSponsor, setObSponsor] = useState('');
  const [obText, setObText] = useState('');
  const [obDiv, setObDiv] = useState('PDD');

  // Submit Sponsor
  const handleAddSponsor = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!spName.trim() || !spContact.trim()) return;
    await addSponsor({
      name: spName.trim(),
      contact: spContact.trim(),
      package: spPackage,
      amount: parseFloat(spAmount) || 0,
      status: spStatus,
    });
    setSpName('');
    setSpContact('');
    setSpAmount('');
  };

  // Update Sponsor Status
  const handleUpdateSponsorStatus = async (id, nextStatus) => {
    if (!canEdit) return;
    await updateSponsor(id, { status: nextStatus });
  };

  // Submit Medpart
  const handleAddMedpart = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!mpName.trim() || !mpContact.trim()) return;
    await addMedpart({
      name: mpName.trim(),
      contact: mpContact.trim(),
      status: mpStatus,
    });
    setMpName('');
    setMpContact('');
  };

  // Submit Obligation
  const handleAddObligation = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!obSponsor.trim() || !obText.trim()) return;
    await addObligation({
      sponsor: obSponsor.trim(),
      obligation: obText.trim(),
      division: obDiv,
      status: 'Pending',
    });
    setObSponsor('');
    setObText('');
  };

  // Toggle Obligation Status
  const handleToggleObligation = async (item) => {
    if (!canToggleObligation(item)) return;
    const nextStatus = item.status === 'Done' ? 'Pending' : 'Done';
    await updateObligation(item.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('sponsorship')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'sponsorship' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Sponsorship Leads
        </button>
        <button
          onClick={() => setSubTab('media')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'media' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Media Partner
        </button>
        <button
          onClick={() => setSubTab('obligations')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'obligations' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Kewajiban Kontraprestasi
        </button>
      </div>

      {/* 1. SPONSORSHIP LEADS */}
      {subTab === 'sponsorship' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Pipeline Pendanaan Sponsor</h4>
              <span className="text-slate-400 text-xs">
                Total Deal: Rp {sponsorships.filter(s => s.status === 'Deal').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-surface-700/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Perusahaan / Brand</th>
                    <th className="px-4 py-4">Paket</th>
                    <th className="px-6 py-4 text-right">Nilai Deal</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4">Kontak</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sponsorships.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500 text-xs">
                        Belum ada prospek sponsor terdaftar.
                      </td>
                    </tr>
                  ) : (
                    sponsorships.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{item.name}</td>
                        <td className="px-4 py-4 text-xs">{item.package}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-400">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateSponsorStatus(item.id, e.target.value)}
                            disabled={!canEdit}
                            className="bg-surface-800 text-xs border border-white/10 text-slate-200 rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="Negosiasi">Negosiasi</option>
                            <option value="Deal">Deal</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-400">{item.contact}</td>
                        <td className="px-4 py-4 text-center">
                          {canEdit ? (
                            <button
                              onClick={() => deleteSponsor(item.id)}
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
            <h3 className="text-md font-bold text-white mb-4">Tambah Prospek Sponsor</h3>
            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Perusahaan / Brand</label>
                <input
                  type="text"
                  value={spName}
                  onChange={(e) => setSpName(e.target.value)}
                  placeholder="Contoh: Telkomsel"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Kontak Person</label>
                <input
                  type="text"
                  value={spContact}
                  onChange={(e) => setSpContact(e.target.value)}
                  placeholder="Contoh: Pak Budi (0812...)"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Pilihan Paket</label>
                  <select
                    value={spPackage}
                    onChange={(e) => setSpPackage(e.target.value)}
                    className="select text-xs"
                    disabled={!canEdit}
                  >
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Custom">Custom / Barter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    value={spAmount}
                    onChange={(e) => setSpAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="input text-xs"
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Masukkan Database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MEDIA PARTNER */}
      {subTab === 'media' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Add form */}
          <div className="card p-6 self-start bg-surface-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Daftarkan Media Partner</h3>
            <form onSubmit={handleAddMedpart} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Akun / Media</label>
                <input
                  type="text"
                  value={mpName}
                  onChange={(e) => setMpName(e.target.value)}
                  placeholder="Contoh: @infokampus"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Kontak Humas</label>
                <input
                  type="text"
                  value={mpContact}
                  onChange={(e) => setMpContact(e.target.value)}
                  placeholder="Contoh: Line/WA/DM"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Status Kerjasama</label>
                <select
                  value={mpStatus}
                  onChange={(e) => setMpStatus(e.target.value)}
                  className="select text-xs"
                  disabled={!canEdit}
                >
                  <option value="Negosiasi">Negosiasi</option>
                  <option value="Deal">Deal</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Tambah Medpart
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" /> Database Media Partner BEM
            </h3>
            {mediaPartners.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                Belum ada Media Partner terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaPartners.map((mp) => (
                  <div key={mp.id} className="card p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{mp.name}</h4>
                      <p className="text-slate-400 text-xs mt-1">Kontak: {mp.contact}</p>
                      <span className={`badge mt-3 text-[10px] ${mp.status === 'Deal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                        {mp.status}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => deleteMedpart(mp.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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
      )}

      {/* 3. OBLIGATIONS CHECKLIST */}
      {subTab === 'obligations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Checklist Kontraprestasi Sponsor</h4>
              <span className="text-slate-400 text-xs">{obligations.length} Kewajiban</span>
            </div>
            <div className="p-6 space-y-4">
              {obligations.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Belum ada kewajiban sponsor yang dicatat.
                </div>
              ) : (
                <div className="space-y-3">
                  {obligations.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3.5 bg-surface-700/20 border border-white/5 rounded-2xl hover:bg-surface-700/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleObligation(item)}
                          disabled={!canToggleObligation(item)}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${item.status === 'Done' ? 'bg-primary-600 border-primary-500 text-white' : 'border-white/20 hover:border-primary-500'}`}
                        >
                          {item.status === 'Done' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <div className="text-xs font-bold text-primary-400 mb-0.5">{item.sponsor}</div>
                          <p className={`text-sm ${item.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.obligation}
                          </p>
                          <span className="badge bg-indigo-950 text-indigo-400 border border-indigo-900 text-[9px] mt-2">
                            Divisi Pelaksana: {item.division}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => deleteObligation(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400"
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
            <h3 className="text-md font-bold text-white mb-4">Catat Kewajiban Sponsor</h3>
            <form onSubmit={handleAddObligation} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama Sponsor</label>
                <input
                  type="text"
                  value={obSponsor}
                  onChange={(e) => setObSponsor(e.target.value)}
                  placeholder="Contoh: Bank Jatim"
                  className="input text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Kewajiban / Output Promosi</label>
                <textarea
                  value={obText}
                  onChange={(e) => setObText(e.target.value)}
                  placeholder="Contoh: Cetak logo sponsor di banner panggung & ID Card panitia"
                  className="input h-24 resize-none text-xs"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Divisi Pelaksana Tugas</label>
                <select
                  value={obDiv}
                  onChange={(e) => setObDiv(e.target.value)}
                  className="select text-xs"
                  disabled={!canEdit}
                >
                  <option value="PDD">PDD (Desain/Banner)</option>
                  <option value="Perlengkapan">Perlengkapan (Stan Booth)</option>
                  <option value="Acara">Acara (Ad-libs/MC)</option>
                  <option value="Humas">Humas (Publikasi Sosmed)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Simpan Kewajiban
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
