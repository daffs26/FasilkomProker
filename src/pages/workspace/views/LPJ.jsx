import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { FileSpreadsheet, Plus, Trash, Printer, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function LPJ({ proker, profile }) {
  const [subTab, setSubTab] = useState('evaluations');

  // Subcollections
  const { data: evaluations, addItem: addEvaluation, deleteItem: deleteEvaluation } = 
    useProkerSubcollection(proker.id, 'evaluations', 'createdAt', 'asc');
  
  // We can fetch RAB data to display in the LPJ summary
  const { data: rab } = useProkerSubcollection(proker.id, 'rab', 'createdAt', 'asc');

  // Evaluation Form
  const [evalNote, setEvalNote] = useState('');
  const [evalDiv, setEvalDiv] = useState(profile?.divisi || 'Acara');

  // Submit Evaluation Note
  const handleAddEval = async (e) => {
    e.preventDefault();
    if (!evalNote.trim()) return;
    await addEvaluation({
      division: evalDiv,
      note: evalNote.trim(),
      author: profile.name,
      date: new Date().toLocaleDateString('id-ID'),
    });
    setEvalNote('');
  };

  const totalSpent = rab.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  const totalAllocation = 15000000;

  // Print LPJ Summary Trigger
  const handlePrintLPJ = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const printWindow = window.open('', '_blank');
    
    // Compile HTML content for clean printing
    const printHTML = `
      <html>
        <head>
          <title>LPJ - ${proker.name}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; color: #333; line-height: 1.6; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px double #000; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0 0 0; font-size: 14px; }
            h2 { font-size: 18px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #000; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 8px; font-size: 13px; text-align: left; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .meta-list { list-style: none; padding-left: 0; }
            .meta-list li { margin-bottom: 8px; font-size: 14px; }
            .evaluation-item { margin-bottom: 15px; font-size: 14px; }
            .evaluation-item .div-name { font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .evaluation-item .content { padding-left: 15px; font-style: italic; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; }
            .footer-sig { text-align: center; width: 200px; }
            .footer-sig p { margin: 0; }
            .footer-sig .space { height: 70px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Badan Eksekutif Mahasiswa (BEM) FASILKOM</h1>
            <h1>Universitas Mercu Buana</h1>
            <p>Sekretariat: Gedung B Ruang B-201, Jl. Meruya Selatan No. 1, Kembangan, Jakarta Barat</p>
          </div>

          <h1 style="text-align: center; font-size: 20px; text-transform: uppercase; margin-bottom: 30px;">
            Laporan Pertanggungjawaban (LPJ)<br/>${proker.name}
          </h1>

          <h2>A. Deskripsi Kegiatan</h2>
          <ul class="meta-list">
            <li><strong>Nama Kegiatan:</strong> ${proker.name}</li>
            <li><strong>Waktu Pelaksanaan:</strong> ${proker.date}</li>
            <li><strong>Lokasi:</strong> ${proker.location}</li>
            <li><strong>Estimasi Peserta:</strong> ${proker.estimatedAttendees} Orang</li>
            <li><strong>Deskripsi Singkat:</strong> ${proker.description}</li>
          </ul>

          <h2>B. Realisasi Anggaran Keuangan (RAB)</h2>
          <table>
            <thead>
              <tr>
                <th>Item Pengeluaran</th>
                <th style="text-align: center;">Qty</th>
                <th class="text-right">Harga Satuan</th>
                <th class="text-right">Total Subtotal</th>
                <th style="text-align: center;">Divisi</th>
              </tr>
            </thead>
            <tbody>
              ${rab.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center;">Tidak ada data anggaran</td>
                </tr>
              ` : rab.map(item => `
                <tr>
                  <td>${item.item}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td class="text-right">Rp ${item.price.toLocaleString('id-ID')}</td>
                  <td class="text-right">Rp ${(item.quantity * item.price).toLocaleString('id-ID')}</td>
                  <td style="text-align: center;">${item.division}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background-color: #f2f2f2;">
                <td colspan="3">TOTAL REALISASI PENGELUARAN</td>
                <td class="text-right">Rp ${totalSpent.toLocaleString('id-ID')}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 13px;">Alokasi Hibah Fakultas: Rp ${totalAllocation.toLocaleString('id-ID')} | Sisa Anggaran: Rp ${(totalAllocation - totalSpent).toLocaleString('id-ID')}</p>

          <h2>C. Hasil Evaluasi Per-Divisi</h2>
          ${evaluations.length === 0 ? `
            <p style="font-style: italic; font-size: 14px;">Belum ada masukan evaluasi divisi.</p>
          ` : evaluations.map(item => `
            <div class="evaluation-item">
              <div class="div-name">Divisi: ${item.division}</div>
              <div class="content">"${item.note}"</div>
              <div style="font-size: 11px; color: #666; margin-left: 15px; margin-top: 2px;">Dilaporkan oleh: ${item.author} (${item.date})</div>
            </div>
          `).join('')}

          <div class="footer">
            <div class="footer-sig">
              <p>Mengetahui,</p>
              <p>Ketua Pelaksana</p>
              <div class="space"></div>
              <p>___________________</p>
            </div>
            <div class="footer-sig">
              <p>Jakarta, ${today}</p>
              <p>Sekretaris BEM</p>
              <div class="space"></div>
              <p>Daffa Rizky</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setSubTab('evaluations')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'evaluations' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Masukan Evaluasi Divisi
        </button>
        <button
          onClick={() => setSubTab('lpj-summary')}
          className={`pb-3 text-sm font-semibold transition-all ${subTab === 'lpj-summary' ? 'text-primary-400 border-b-2 border-b-primary-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Pratinjau LPJ Cetak
        </button>
      </div>

      {/* 1. EVALUATION PANEL */}
      {subTab === 'evaluations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Catatan Evaluasi Pasca-Acara
            </h3>

            {evaluations.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                Belum ada catatan evaluasi divisi yang diinput.
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map((item) => (
                  <div key={item.id} className="card p-5 border-l-4 border-l-amber-500 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                        Divisi {item.division}
                      </span>
                      {profile.divisi === 'BPH' && (
                        <button
                          onClick={() => deleteEvaluation(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3 italic">
                      "{item.note}"
                    </p>
                    <div className="text-[10px] text-slate-500 text-right">
                      Oleh: {item.author} · {item.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="card p-6 self-start bg-surface-800">
            <h3 className="text-md font-bold text-white mb-4">Masukkan Evaluasi Divisi</h3>
            <form onSubmit={handleAddEval} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Divisi Pengirim</label>
                <select
                  value={evalDiv}
                  onChange={(e) => setEvalDiv(e.target.value)}
                  className="select text-xs"
                >
                  <option value="Acara">Acara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Humas">Humas</option>
                  <option value="PDD">PDD</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="BPH">BPH</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Evaluasi / Hambatan & Solusi</label>
                <textarea
                  value={evalNote}
                  onChange={(e) => setEvalNote(e.target.value)}
                  placeholder="Tuliskan kendala saat hari H, evaluasi teknis, serta saran perbaikan untuk proker selanjutnya..."
                  className="input h-32 resize-none text-xs"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs mt-2">
                <Plus className="w-4 h-4" /> Kirim Catatan Evaluasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. PRINT PREVIEW LPJ SUMMARY */}
      {subTab === 'lpj-summary' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary-400" /> Ringkasan Laporan Pertanggungjawaban (LPJ) Resmi
            </h3>
            <button
              onClick={handlePrintLPJ}
              className="btn-primary flex items-center gap-2 text-xs py-2"
            >
              <Printer className="w-4.5 h-4.5" /> Cetak LPJ Formal (PDF)
            </button>
          </div>

          {/* Styled document page representation */}
          <div className="card p-8 bg-white text-slate-800 border border-slate-300 shadow-2xl max-w-4xl mx-auto font-serif text-sm">
            {/* Header */}
            <div className="text-center border-b-4 border-double border-slate-800 pb-4 mb-8">
              <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900 border-none pb-0 m-0">BADAN EKSEKUTIF MAHASISWA (BEM) FASILKOM</h2>
              <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900 border-none pb-0 m-0">UNIVERSITAS MERCU BUANA</h2>
              <p className="font-sans text-xs text-slate-500 mt-1 m-0">Sekretariat: Gedung B Ruang B-201, Jl. Meruya Selatan No. 1, Kembangan, Jakarta Barat</p>
            </div>

            <h3 className="text-center text-base font-extrabold uppercase mb-8 tracking-wide text-slate-900">
              LAPORAN PERTANGGUNGJAWABAN (LPJ)<br/>{proker.name}
            </h3>

            {/* Section A */}
            <div className="space-y-2 mb-6">
              <h4 className="font-bold border-b border-slate-300 pb-1 text-slate-900 text-xs font-sans uppercase">A. DESKRIPSI KEGIATAN</h4>
              <table className="w-full text-xs text-left text-slate-700 table-fixed border-none">
                <tbody>
                  <tr className="border-none"><td className="w-1/4 font-semibold border-none py-1">Nama Kegiatan</td><td className="border-none py-1">: {proker.name}</td></tr>
                  <tr className="border-none"><td className="w-1/4 font-semibold border-none py-1">Waktu Pelaksanaan</td><td className="border-none py-1">: {proker.date}</td></tr>
                  <tr className="border-none"><td className="w-1/4 font-semibold border-none py-1">Lokasi</td><td className="border-none py-1">: {proker.location}</td></tr>
                  <tr className="border-none"><td className="w-1/4 font-semibold border-none py-1">Jumlah Undangan</td><td className="border-none py-1">: {proker.estimatedAttendees} Orang</td></tr>
                  <tr className="border-none"><td className="w-1/4 font-semibold border-none py-1">Deskripsi Kegiatan</td><td className="border-none py-1">: {proker.description}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Section B */}
            <div className="space-y-2 mb-6">
              <h4 className="font-bold border-b border-slate-300 pb-1 text-slate-900 text-xs font-sans uppercase">B. REALISASI ANGGARAN KEUANGAN</h4>
              <table className="w-full border border-slate-300 text-xs text-left text-slate-700">
                <thead className="bg-slate-50 font-sans text-[10px] font-bold text-slate-900 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300">Item Pengeluaran</th>
                    <th className="p-2 border border-slate-300 text-center">Qty</th>
                    <th className="p-2 border border-slate-300 text-right">Harga Satuan</th>
                    <th className="p-2 border border-slate-300 text-right">Total</th>
                    <th className="p-2 border border-slate-300 text-center">Divisi</th>
                  </tr>
                </thead>
                <tbody>
                  {rab.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-2 border border-slate-300 text-center text-slate-400 italic">Tidak ada rincian RAB terinput</td>
                    </tr>
                  ) : (
                    rab.map(item => (
                      <tr key={item.id}>
                        <td className="p-2 border border-slate-300 font-semibold">{item.item}</td>
                        <td className="p-2 border border-slate-300 text-center">{item.quantity}</td>
                        <td className="p-2 border border-slate-300 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="p-2 border border-slate-300 text-right">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                        <td className="p-2 border border-slate-300 text-center uppercase font-sans text-[9px] font-bold">{item.division}</td>
                      </tr>
                    ))
                  )}
                  <tr className="font-bold bg-slate-50 text-slate-900">
                    <td colSpan="3" className="p-2 border border-slate-300 font-bold">TOTAL REALISASI ANGGARAN</td>
                    <td className="p-2 border border-slate-300 text-right font-bold">Rp {totalSpent.toLocaleString('id-ID')}</td>
                    <td className="p-2 border border-slate-300"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section C */}
            <div className="space-y-2 mb-10">
              <h4 className="font-bold border-b border-slate-300 pb-1 text-slate-900 text-xs font-sans uppercase">C. EVALUASI DAN HAMBATAN KERJA</h4>
              {evaluations.length === 0 ? (
                <p className="text-xs italic text-slate-500">Belum ada evaluasi dari divisi yang dimasukkan.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {evaluations.map(item => (
                    <div key={item.id} className="text-xs">
                      <div className="font-bold text-slate-900 uppercase font-sans text-[10px]">DIVISI: {item.division}</div>
                      <div className="italic text-slate-700 pl-3">"{item.note}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="flex justify-between text-xs font-sans text-slate-800 pt-6 border-t border-slate-100">
              <div className="text-center w-48">
                <p>Mengetahui,</p>
                <p className="font-bold">Ketua Pelaksana</p>
                <div className="h-16"></div>
                <p className="underline font-bold">____________________</p>
              </div>
              <div className="text-center w-48">
                <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Sekretaris BEM</p>
                <div className="h-16"></div>
                <p className="underline font-bold">Daffa Rizky</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
