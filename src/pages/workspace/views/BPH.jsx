import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Users, DollarSign, FileSpreadsheet, Plus, Trash, CheckCircle2, Copy, Printer, FileText } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function BPH({ proker, updateProkerDetails }) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState('structure');

  // Subcollections
  const { data: roles, addItem: addRole, deleteItem: deleteRole } = 
    useProkerSubcollection(proker.id, 'roles', 'createdAt', 'asc');
  const { data: rab, addItem: addRabItem, deleteItem: deleteRabItem } = 
    useProkerSubcollection(proker.id, 'rab', 'createdAt', 'asc');

  // Role Form
  const [roleName, setRoleName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDiv, setRoleDiv] = useState('BPH');

  // RAB Form
  const [rabItem, setRabItem] = useState('');
  const [rabQty, setRabQty] = useState('');
  const [rabPrice, setRabPrice] = useState('');
  const [rabDiv, setRabDiv] = useState('BPH');

  // Proposal Status
  const handleProposalStatusChange = async (status) => {
    try {
      await updateProkerDetails({ proposalStatus: status });
    } catch (e) {
      console.error(e);
    }
  };

  // Letter Generator Form
  const [letterType, setLetterType] = useState('dispen');
  const [letterNo, setLetterNo] = useState('102/SURAT-BEM/VI/2026');
  const [recipient, setRecipient] = useState('Dekan Fakultas Ilmu Komputer UMB');
  const [stdName, setStdName] = useState('');
  const [stdNim, setStdNim] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [agenda, setAgenda] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');

  // Handle Role Submit
  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim() || !roleTitle.trim()) return;
    await addRole({
      name: roleName.trim(),
      role: roleTitle.trim(),
      division: roleDiv,
    });
    setRoleName('');
    setRoleTitle('');
  };

  // Handle RAB Submit
  const handleAddRab = async (e) => {
    e.preventDefault();
    if (!rabItem.trim() || !rabQty || !rabPrice) return;
    await addRabItem({
      item: rabItem.trim(),
      quantity: parseInt(rabQty) || 1,
      price: parseFloat(rabPrice) || 0,
      division: rabDiv,
    });
    setRabItem('');
    setRabQty('');
    setRabPrice('');
  };

  // Budget Calculations
  const totalAllocation = 15000000; // Rp 15.000.000 (Default BEM Allocation)
  const totalSpent = rab.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  const remaining = totalAllocation - totalSpent;
  const spentPercent = Math.min((totalSpent / totalAllocation) * 100, 100);

  // Letter Templates Generator
  const generateLetterText = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (letterType === 'dispen') {
      setGeneratedLetter(`
BEM FASILKOM UNIVERSITAS MERCU BUANA
Sekretariat: Gedung B Ruang B-201, Jl. Meruya Selatan No. 1, Jakarta Barat
--------------------------------------------------------------------------------

Nomor   : ${letterNo}
Lampiran: -
Hal     : Permohonan Dispensasi Kuliah

Yth. Bapak/Ibu Dosen Pengampu Mata Kuliah
Fakultas Ilmu Komputer
Universitas Mercu Buana

Dengan hormat,
Sehubungan dengan diselenggarakannya program kerja "${proker.name}" oleh Badan Eksekutif Mahasiswa (BEM) FASILKOM UMB, kami memohon kesediaan Bapak/Ibu untuk memberikan dispensasi kuliah kepada mahasiswa berikut:

Nama    : ${stdName || '[Nama Lengkap]'}
NIM     : ${stdNim || '[NIM]'}
Jabatan : Panitia (${proker.name})

Mahasiswa tersebut di atas memohon izin dispensasi pada tanggal ${dateStr || '[Tanggal]'} guna mengikuti persiapan/pelaksanaan kegiatan tersebut.

Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.

Jakarta, ${today}

Mengetahui,
Ketua Pelaksana                    Sekretaris BEM


...................                Daffa Rizky
      `);
    } else if (letterType === 'proposal') {
      setGeneratedLetter(`
PROPOSAL KEGIATAN
${proker.name.toUpperCase()}
BEM FASILKOM UNIVERSITAS MERCU BUANA 2026

--------------------------------------------------------------------------------
A. LATAR BELAKANG
Fakultas Ilmu Komputer Universitas Mercu Buana memiliki komitmen tinggi dalam mencetak mahasiswa yang berdaya saing global, baik di bidang akademis maupun non-akademis. Melalui program kerja "${proker.name}" ini, BEM FASILKOM berupaya mewadahi minat bakat serta sinergi mahasiswa.

B. TUJUAN KEGIATAN
1. Meningkatkan solidaritas antar mahasiswa FASILKOM.
2. Melatih kepemimpinan serta soft skill kepanitiaan.
3. Merealisasikan visi kerja organisasi BEM FASILKOM 2026.

C. SASARAN PESERTA
Estimasi peserta kegiatan adalah sejumlah ${proker.estimatedAttendees || 150} orang dari lingkungan civitas akademika Universitas Mercu Buana.

D. WAKTU DAN LOKASI PELAKSANAAN
Hari, Tanggal : ${proker.date}
Waktu         : 08.00 - Selesai
Tempat        : ${proker.location}

E. RENCANA ANGGARAN BIAYA (RAB)
Total kebutuhan anggaran adalah sebesar Rp ${totalSpent.toLocaleString('id-ID')} (Rincian terlampir pada sistem dashboard RAB ProkerKU).

--------------------------------------------------------------------------------
Demikian proposal ini diajukan untuk mendapatkan persetujuan dan dukungan Fakultas.
      `);
    } else if (letterType === 'meeting') {
      setGeneratedLetter(`
BADAN EKSEKUTIF MAHASISWA (BEM) FASILKOM
UNIVERSITAS MERCU BUANA
--------------------------------------------------------------------------------

Nomor   : ${letterNo}
Hal     : Undangan Rapat Koordinasi

Yth. Seluruh Koordinator & Anggota Panitia
Kepanitiaan ${proker.name}
di Tempat

Dengan hormat,
Mengharap kehadiran rekan-rekan panitia dalam Rapat Koordinasi yang akan dilaksanakan pada:

Hari, Tanggal : ${dateStr || '[Hari, Tanggal Rapat]'}
Waktu         : ${agenda ? agenda.split(';')[0] || '19:00 WIB' : '19:00 WIB'} - Selesai
Tempat        : ${proker.location} / Google Meet
Agenda        : ${agenda || 'Pembahasan rundown teknis detail H-7'}

Mengingat pentingnya rapat koordinasi ini demi kelancaran program kerja ${proker.name}, dimohon kehadiran tepat waktu.

Jakarta, ${today}

Salam Perjuangan,

Ketua Pelaksana


...................
      `);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    alert('Surat berhasil disalin ke clipboard!');
  };

  const printLetter = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${generatedLetter}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs BPH */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('structure')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'structure' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Struktur & Proposal
        </button>
        <button
          onClick={() => setSubTab('rab')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'rab' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          RAB Keuangan
        </button>
        <button
          onClick={() => setSubTab('letters')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'letters' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Generator Surat
        </button>
      </div>

      {/* 1. TAB STRUCTURE & PROPOSAL */}
      {subTab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Roles List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" /> Struktur Kepanitiaan Inti
            </h3>

            {roles.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">
                Belum ada susunan panitia inti yang didaftarkan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((item) => (
                  <div key={item.id} className="card p-4 flex items-center justify-between border border-white/5">
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <p className="text-slate-400 text-xs mt-1">{item.role}</p>
                      <span className="badge bg-primary-950 text-primary-400 border border-primary-800 text-[10px] mt-2 block w-fit">
                        Divisi {item.division}
                      </span>
                    </div>
                    {profile.divisi === 'BPH' && (
                      <button
                        onClick={() => deleteRole(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5"
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

          {/* Setup Roles and Proposal Status */}
          <div className="space-y-6">
            {/* Add Role Form */}
            <div className="card p-6">
              <h3 className="text-md font-bold text-white mb-4">Tambahkan Panitia Inti</h3>
              <form onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Nama Anggota</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Contoh: Zian Farras"
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Jabatan Kepanitiaan</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Contoh: Ketua Pelaksana / Koor Acara"
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Divisi Utama</label>
                  <select
                    value={roleDiv}
                    onChange={(e) => setRoleDiv(e.target.value)}
                    className="select text-xs"
                  >
                    <option value="BPH">BPH (Pengurus Harian)</option>
                    <option value="Acara">Acara</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Humas">Humas</option>
                    <option value="PDD">PDD</option>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Kesehatan">Kesehatan</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full py-2 flex justify-center text-xs">
                  <Plus className="w-4 h-4" /> Tambah Struktur
                </button>
              </form>
            </div>

            {/* Proposal Workflow Status */}
            <div className="card p-6">
              <h3 className="text-md font-bold text-white mb-4">Alur Persetujuan Proposal</h3>
              <div className="space-y-3">
                {['Drafting', 'BPH Review', 'Kemahasiswaan', 'Approved'].map((status, index) => {
                  const isActive = proker.proposalStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => profile.divisi === 'BPH' && handleProposalStatusChange(status)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isActive ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-surface-700/30 border-white/5 text-slate-400 hover:bg-surface-700/50'}`}
                    >
                      <span className="text-xs font-semibold">{index + 1}. {status}</span>
                      {isActive && <CheckCircle2 className="w-4.5 h-4.5 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB RAB FINANCE */}
      {subTab === 'rab' && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5 bg-gradient-to-br from-blue-950/20 to-surface-800 border border-white/5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Total Alokasi Dana (BEM)</div>
              <div className="text-2xl font-extrabold text-white mt-1">Rp {totalAllocation.toLocaleString('id-ID')}</div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-indigo-950/20 to-surface-800 border border-white/5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Total Pengeluaran RAB</div>
              <div className="text-2xl font-extrabold text-primary-400 mt-1">Rp {totalSpent.toLocaleString('id-ID')}</div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-emerald-950/20 to-surface-800 border border-white/5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Sisa Sisa Anggaran</div>
              <div className={`text-2xl font-extrabold mt-1 ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rp {remaining.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card p-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Efisiensi Anggaran Terpakai</span>
              <span className="font-bold text-white">{spentPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-700 h-3.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${remaining >= 0 ? 'bg-primary-500' : 'bg-red-500'}`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
          </div>

          {/* RAB Form & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2 card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h4 className="font-bold text-white text-base">Detail Rencana Anggaran (RAB)</h4>
                <span className="text-slate-400 text-xs">{rab.length} Item pengeluaran</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-surface-700/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Item Pengeluaran</th>
                      <th className="px-4 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Harga Satuan</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-4 py-4 text-center">Divisi</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rab.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500 text-xs">
                          Belum ada item anggaran belanja yang diajukan.
                        </td>
                      </tr>
                    ) : (
                      rab.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">{item.item}</td>
                          <td className="px-4 py-4 text-center">{item.quantity}</td>
                          <td className="px-6 py-4 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-right text-primary-400 font-semibold">
                            Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-600 text-slate-200">
                              {item.division}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {profile.divisi === 'BPH' && (
                              <button
                                onClick={() => deleteRabItem(item.id)}
                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
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
              <h3 className="text-md font-bold text-white mb-4">Ajukan Anggaran Baru</h3>
              <form onSubmit={handleAddRab} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Item / Kebutuhan</label>
                  <input
                    type="text"
                    value={rabItem}
                    onChange={(e) => setRabItem(e.target.value)}
                    placeholder="Contoh: Sewa Sound System"
                    className="input text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Jumlah (Qty)</label>
                    <input
                      type="number"
                      value={rabQty}
                      onChange={(e) => setRabQty(e.target.value)}
                      placeholder="Contoh: 1"
                      className="input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Harga Satuan</label>
                    <input
                      type="number"
                      value={rabPrice}
                      onChange={(e) => setRabPrice(e.target.value)}
                      placeholder="Contoh: 150000"
                      className="input text-xs"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Divisi Penanggungjawab</label>
                  <select
                    value={rabDiv}
                    onChange={(e) => setRabDiv(e.target.value)}
                    className="select text-xs"
                  >
                    <option value="BPH">BPH</option>
                    <option value="Acara">Acara</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Humas">Humas</option>
                    <option value="PDD">PDD</option>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Kesehatan">Kesehatan</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2">
                  <Plus className="w-4 h-4" /> Masukkan Pengeluaran
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB LETTERS */}
      {subTab === 'letters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="card p-6 self-start bg-surface-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Pilih & Isi Format Surat</h3>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Jenis Dokumen</label>
              <select
                value={letterType}
                onChange={(e) => setLetterType(e.target.value)}
                className="select text-xs"
              >
                <option value="dispen">Surat Dispensasi Kuliah</option>
                <option value="proposal">Sampul & Bab Pembuka Proposal</option>
                <option value="meeting">Undangan Rapat Koordinasi</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Nomor Surat Resmi</label>
              <input
                type="text"
                value={letterNo}
                onChange={(e) => setLetterNo(e.target.value)}
                className="input text-xs"
              />
            </div>

            {letterType === 'dispen' && (
              <>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Nama Mahasiswa</label>
                  <input
                    type="text"
                    value={stdName}
                    onChange={(e) => setStdName(e.target.value)}
                    placeholder="Nama lengkap panitia"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">NIM Mahasiswa</label>
                  <input
                    type="text"
                    value={stdNim}
                    onChange={(e) => setStdNim(e.target.value)}
                    placeholder="NIM panitia"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Tanggal Dispensasi</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    placeholder="Contoh: 20 Desember 2026"
                    className="input text-xs"
                  />
                </div>
              </>
            )}

            {letterType === 'meeting' && (
              <>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Hari/Tanggal Rapat</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    placeholder="Contoh: Sabtu, 13 Juni 2026"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Agenda Detail</label>
                  <input
                    type="text"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="Contoh: Finalisasi rundown H-7"
                    className="input text-xs"
                  />
                </div>
              </>
            )}

            {letterType === 'proposal' && (
              <div className="p-3 bg-primary-600/10 border border-primary-500/20 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                Proposal menyadur data langsung dari detail program kerja (Tanggal, Lokasi, Estimasi Peserta, dll.).
              </div>
            )}

            <button
              onClick={generateLetterText}
              className="btn-primary w-full py-2.5 text-xs flex justify-center mt-4"
            >
              <FileText className="w-4 h-4" /> Generate Dokumen
            </button>
          </div>

          {/* Generated View */}
          <div className="lg:col-span-2 card p-6 bg-surface-900 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <h4 className="font-bold text-white text-sm">Dokumen Ter-generate</h4>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!generatedLetter}
                    className="p-2 bg-surface-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-colors disabled:opacity-50"
                    title="Copy Text"
                  >
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={printLetter}
                    disabled={!generatedLetter}
                    className="p-2 bg-surface-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-colors disabled:opacity-50"
                    title="Print Document"
                  >
                    <Printer className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {generatedLetter ? (
                <pre className="font-mono text-xs text-slate-300 leading-relaxed p-4 bg-surface-800 rounded-xl overflow-x-auto select-all max-h-[400px]">
                  {generatedLetter}
                </pre>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-slate-500 text-sm">
                  <FileText className="w-10 h-10 text-slate-700 mb-2" />
                  Isi formulir dan klik "Generate Dokumen" untuk melihat draf surat resmi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
