import { useState } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Coffee, Calculator, Plus, Trash, ShieldAlert, BadgeInfo } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function DivisiKonsum({ proker }) {
  const { profile } = useAuth();

  // Subcollection
  const { data: catering, addItem: addCatering, deleteItem: deleteCatering } = 
    useProkerSubcollection(proker.id, 'catering', 'createdAt', 'asc');

  // Meal Calculator State
  const [staffCount, setStaffCount] = useState(50);
  const [vipCount, setVipCount] = useState(10);
  const [pricePerBox, setPricePerBox] = useState(20000);
  const [mealFreq, setMealFreq] = useState(1);

  // Catering Log Form
  const [cVendor, setCVendor] = useState('');
  const [cMenu, setCMenu] = useState('');
  const [cPrice, setCPrice] = useState('');
  const [cQty, setCQty] = useState('');
  const [cType, setCType] = useState('Makan Siang Panitia');

  // Calculations
  const totalBoxes = (parseInt(staffCount) || 0 + parseInt(vipCount) || 0) * (parseInt(mealFreq) || 1);
  const estTotalCost = (parseInt(staffCount) * pricePerBox * mealFreq) + (parseInt(vipCount) * pricePerBox * mealFreq);
  const divisionLimit = 3000000; // Rp 3.000.000 max budget allocation warning
  const isOverBudget = estTotalCost > divisionLimit;

  // Add Catering log entry
  const handleAddCatering = async (e) => {
    e.preventDefault();
    if (!cVendor.trim() || !cMenu.trim() || !cPrice || !cQty) return;
    await addCatering({
      vendor: cVendor.trim(),
      menu: cMenu.trim(),
      price: parseFloat(cPrice) || 0,
      quantity: parseInt(cQty) || 1,
      type: cType,
    });
    setCVendor('');
    setCMenu('');
    setCPrice('');
    setCQty('');
  };

  const actualSpent = catering.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Meal Calculator */}
        <div className="card p-6 bg-gradient-to-r from-primary-950/20 to-surface-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary-400" /> Kalkulator Logistik Makanan
            </h3>
            <p className="text-xs text-slate-400 mb-6">Hitung estimasi kebutuhan porsi dan budget konsumsi panitia/VIP secara instan.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Jumlah Panitia</label>
                  <input
                    type="number"
                    value={staffCount}
                    onChange={(e) => setStaffCount(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Jumlah Undangan VIP</label>
                  <input
                    type="number"
                    value={vipCount}
                    onChange={(e) => setVipCount(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Harga Nasi Box (Rp)</label>
                  <input
                    type="number"
                    value={pricePerBox}
                    onChange={(e) => setPricePerBox(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Frekuensi Makan</label>
                  <input
                    type="number"
                    value={mealFreq}
                    onChange={(e) => setMealFreq(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Total Box:</span>
              <span className="text-white font-extrabold ml-1.5">{totalBoxes} Porsi</span>
            </div>
            <div>
              <span className="text-slate-400">Total Kebutuhan:</span>
              <span className="text-primary-400 font-extrabold ml-1.5">Rp {estTotalCost.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Budget Warning card */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Limit Anggaran Divisi</h3>
            <div className="text-xl font-black text-white">Rp {divisionLimit.toLocaleString('id-ID')}</div>
            <p className="text-xs text-slate-400 mt-1">Alokasi maksimal untuk divisi Konsumsi pada proker ini.</p>
            
            {isOverBudget ? (
              <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Melebihi Limit Anggaran!</span>
                  Estimasi kalkulator melebihi alokasi dana sebesar Rp {(estTotalCost - divisionLimit).toLocaleString('id-ID')}. Mohon koordinasikan dengan Bendahara.
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
                <BadgeInfo className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Dalam Batas Aman!</span>
                  Kalkulator kebutuhan Anda masih berada di bawah limit anggaran divisi.
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 text-xs flex justify-between">
            <span className="text-slate-400">Pengeluaran Aktual Terinput:</span>
            <span className={`font-extrabold ${actualSpent > divisionLimit ? 'text-red-400' : 'text-emerald-400'}`}>
              Rp {actualSpent.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Catering form */}
        <div className="card p-6 bg-surface-800 self-start">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Catat Pemesanan Katering</h3>
          <form onSubmit={handleAddCatering} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Nama Rumah Makan / Catering</label>
              <input
                type="text"
                value={cVendor}
                onChange={(e) => setCVendor(e.target.value)}
                placeholder="Contoh: Catering Berkah"
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Pilihan Menu</label>
              <input
                type="text"
                value={cMenu}
                onChange={(e) => setCMenu(e.target.value)}
                placeholder="Contoh: Nasi Ayam Bakar + Es Teh"
                className="input text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Harga Satuan</label>
                <input
                  type="number"
                  value={cPrice}
                  onChange={(e) => setCPrice(e.target.value)}
                  placeholder="Contoh: 18000"
                  className="input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Porsi (Qty)</label>
                <input
                  type="number"
                  value={cQty}
                  onChange={(e) => setCQty(e.target.value)}
                  placeholder="Contoh: 60"
                  className="input text-xs"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Kategori Porsi</label>
              <select
                value={cType}
                onChange={(e) => setCType(e.target.value)}
                className="select text-xs"
              >
                <option value="Makan Siang Panitia">Makan Siang Panitia</option>
                <option value="Makan Malam Panitia">Makan Malam Panitia</option>
                <option value="Snack Box Panitia">Snack Box Panitia</option>
                <option value="Makan Tamu VIP">Makan Tamu VIP</option>
                <option value="Snack Tamu VIP">Snack Tamu VIP</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 flex justify-center text-xs">
              <Plus className="w-4 h-4" /> Masukkan Data Pemesanan
            </button>
          </form>
        </div>
      </div>

      {/* Catering Log List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" /> Log Pemesanan & Pengiriman Konsumsi
          </h4>
          <span className="text-slate-400 text-xs">{catering.length} Log terdata</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-surface-700/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Penyedia Katering</th>
                <th className="px-6 py-4">Menu Makanan</th>
                <th className="px-4 py-4">Kategori Porsi</th>
                <th className="px-4 py-4 text-center">Porsi (Qty)</th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-right">Total Tagihan</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {catering.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500 text-xs">
                    Belum ada log pemesanan katering makanan yang diinput.
                  </td>
                </tr>
              ) : (
                catering.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{item.vendor}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{item.menu}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{item.type}</td>
                    <td className="px-4 py-4 text-center">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right text-amber-500 font-bold">
                      Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {profile.divisi === 'Konsumsi' || profile.divisi === 'BPH' ? (
                        <button
                          onClick={() => deleteCatering(item.id)}
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
    </div>
  );
}
