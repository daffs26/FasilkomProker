import { useState, useEffect, useRef } from 'react';
import { useProkerSubcollection } from '../../../hooks/useProker';
import { Map, Plus, Trash, LayoutGrid, Layers, Edit3, Settings } from 'lucide-react';

const ITEM_TYPES = [
  { value: 'stage', label: 'Panggung Utama', color: 'bg-primary-600 border-primary-400' },
  { value: 'sound', label: 'Sound System', color: 'bg-yellow-600 border-yellow-400' },
  { value: 'table', label: 'Meja Registrasi / Logistik', color: 'bg-indigo-600 border-indigo-400' },
  { value: 'chair', label: 'Kursi VIP / Peserta', color: 'bg-emerald-600 border-emerald-400' },
];

export default function LayoutWorkspace({ proker, profile }) {
  const canEdit = !!profile; // Anyone in the workspace committee can edit

  // 1. Layout Sessions
  const { data: layouts, loading: loadingLayouts, addItem: addLayout, deleteItem: deleteLayout } =
    useProkerSubcollection(proker.id, 'layouts', 'createdAt', 'asc');

  const [activeLayoutId, setActiveLayoutId] = useState('');
  const [newLayoutName, setNewLayoutName] = useState('');
  const [isAddingLayout, setIsAddingLayout] = useState(false);

  // 2. Floor Plan Items
  const { data: floorPlan, addItem: addFloorItem, updateItem: updateFloorItem, deleteItem: deleteFloorItem } =
    useProkerSubcollection(proker.id, 'floorPlan', 'createdAt', 'asc');

  const [selectedType, setSelectedType] = useState('stage');
  const [itemText, setItemText] = useState('');
  const canvasRef = useRef(null);

  // Auto-create default layout session if empty
  useEffect(() => {
    if (!loadingLayouts && layouts.length === 0 && canEdit) {
      addLayout({ name: 'Layout Utama' });
    }
  }, [layouts, loadingLayouts, canEdit]);

  // Set default active layout when list loads
  useEffect(() => {
    if (layouts.length > 0 && !activeLayoutId) {
      // Find default or first layout
      setActiveLayoutId(layouts[0].id);
    }
  }, [layouts, activeLayoutId]);

  const handleAddLayout = async (e) => {
    e.preventDefault();
    if (!newLayoutName.trim()) return;
    await addLayout({ name: newLayoutName.trim() });
    setNewLayoutName('');
    setIsAddingLayout(false);
  };

  const handleDeleteLayout = async (layoutId, layoutName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus sesi layout "${layoutName}"? Semua barang di dalamnya akan terhapus.`)) {
      // Delete layout session
      await deleteLayout(layoutId);
      // Delete all items belonging to this layout
      const itemsToDelete = floorPlan.filter(item => item.layoutId === layoutId);
      for (const item of itemsToDelete) {
        await deleteFloorItem(item.id);
      }
      if (activeLayoutId === layoutId) {
        const remaining = layouts.filter(l => l.id !== layoutId);
        setActiveLayoutId(remaining.length > 0 ? remaining[0].id : '');
      }
    }
  };

  // Click Canvas to Add Item
  const handleCanvasClick = async (e) => {
    if (!canEdit || !activeLayoutId) return;

    // ONLY add item if user clicked DIRECTLY on canvas background,
    // NOT on an existing item or its buttons/resize handles!
    if (e.target !== canvasRef.current) return;

    const typeObj = ITEM_TYPES.find((t) => t.value === selectedType);
    const label = itemText.trim() || (typeObj ? typeObj.label : 'Barang');

    // Default sizes based on type
    let defaultWidth = 120;
    let defaultHeight = 50;
    if (selectedType === 'stage') { defaultWidth = 180; defaultHeight = 80; }
    else if (selectedType === 'sound') { defaultWidth = 60; defaultHeight = 60; }
    else if (selectedType === 'table') { defaultWidth = 140; defaultHeight = 50; }
    else if (selectedType === 'chair') { defaultWidth = 45; defaultHeight = 45; }

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = 500;

    // Center the item at click position
    let x = Math.round(e.clientX - rect.left - (defaultWidth / 2));
    let y = Math.round(e.clientY - rect.top - (defaultHeight / 2));

    // Clamp coordinates to keep inside canvas
    x = Math.max(0, Math.min(x, canvasWidth - defaultWidth));
    y = Math.max(0, Math.min(y, canvasHeight - defaultHeight));

    await addFloorItem({
      text: label,
      type: selectedType,
      layoutId: activeLayoutId,
      x,
      y,
      width: defaultWidth,
      height: defaultHeight
    });

    setItemText('');
  };

  // Drag and Drop handlers for Floor Plan items
  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData('text/plain', itemId);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const offsetX = parseFloat(e.dataTransfer.getData('offsetX')) || 0;
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY')) || 0;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = 500;

    const item = floorPlan.find(item => item.id === itemId);
    let itemWidth = 120;
    let itemHeight = 50;
    if (item) {
      let defaultWidth = 120;
      let defaultHeight = 50;
      if (item.type === 'stage') { defaultWidth = 180; defaultHeight = 80; }
      else if (item.type === 'sound') { defaultWidth = 60; defaultHeight = 60; }
      else if (item.type === 'table') { defaultWidth = 140; defaultHeight = 50; }
      else if (item.type === 'chair') { defaultWidth = 45; defaultHeight = 45; }
      itemWidth = item.width || defaultWidth;
      itemHeight = item.height || defaultHeight;
    }

    let x = Math.round(e.clientX - rect.left - offsetX);
    let y = Math.round(e.clientY - rect.top - offsetY);

    // Clamp values to keep item inside canvas
    x = Math.max(0, Math.min(x, canvasWidth - itemWidth));
    y = Math.max(0, Math.min(y, canvasHeight - itemHeight));

    try {
      await updateFloorItem(itemId, { x, y });
    } catch (err) {
      console.error("Gagal mengupdate posisi barang:", err);
    }
  };

  // Resize end handler to save sizes
  const handleResizeEnd = async (e, itemId) => {
    e.stopPropagation();
    const el = e.currentTarget;
    const newWidth = el.offsetWidth;
    const newHeight = el.offsetHeight;
    try {
      await updateFloorItem(itemId, { width: newWidth, height: newHeight });
    } catch (err) {
      console.error("Gagal mengupdate ukuran barang:", err);
    }
  };

  // Filter items to show only current layout's items
  const activeLayoutItems = floorPlan.filter(item => item.layoutId === activeLayoutId);
  const activeLayoutObj = layouts.find(l => l.id === activeLayoutId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge bg-primary-600/20 text-primary-400 border border-primary-500/20 mb-3">
            Tata Letak & Venue
          </span>
          <h2 className="text-2xl font-bold text-white mb-1">Floor Plan Layout Planner</h2>
          <p className="text-slate-400 text-sm">Rencanakan tata letak panggung, registrasi, sound, dan kursi di lapangan.</p>
        </div>
      </div>

      {/* Sesi Layout Selector Bar */}
      <div className="card p-4 bg-surface-800 border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers className="w-5 h-5 text-primary-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">Sesi Layout Aktif:</span>
          {loadingLayouts ? (
            <span className="text-xs text-slate-500">Memuat Sesi...</span>
          ) : (
            <select
              value={activeLayoutId}
              onChange={(e) => setActiveLayoutId(e.target.value)}
              className="select py-1.5 px-3 bg-surface-900 border-white/10 text-xs w-full sm:w-60 font-semibold"
            >
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {activeLayoutObj && layouts.length > 1 && canEdit && (
            <button
              onClick={() => handleDeleteLayout(activeLayoutObj.id, activeLayoutObj.name)}
              className="px-3 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash className="w-3.5 h-3.5" /> Hapus Sesi Ini
            </button>
          )}
          {canEdit && (
            <>
              {!isAddingLayout ? (
                <button
                  onClick={() => setIsAddingLayout(true)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Sesi Layout Baru
                </button>
              ) : (
                <form onSubmit={handleAddLayout} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Nama Sesi Baru..."
                    className="input py-1 px-3 text-xs w-full sm:w-44 bg-surface-900 border-white/15"
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn-primary text-xs py-1.5 px-3">Simpan</button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingLayout(false); setNewLayoutName(''); }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Batal
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbox */}
        <div className="card p-6 self-start bg-surface-800 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">1. Pilih Jenis Barang</h3>
            <div className="grid grid-cols-1 gap-2">
              {ITEM_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(t.value)}
                  disabled={!canEdit}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedType === t.value ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-surface-700/30 border-white/5 text-slate-400 hover:bg-surface-700/50'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-md ${t.color.split(' ')[0]} border border-white/20`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">2. Beri Label / Nama</h3>
            <input
              type="text"
              value={itemText}
              onChange={(e) => setItemText(e.target.value)}
              placeholder="Contoh: Panggung Band"
              className="input text-xs"
              disabled={!canEdit}
            />
          </div>

          <div className="p-3 bg-surface-700/50 rounded-xl text-[10px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300 block mb-0.5">Petunjuk:</span>
            {canEdit ? (
              'Pilih jenis barang di atas. Beri nama khusus jika diinginkan (jika kosong, nama jenis barang digunakan otomatis). Klik pada kanvas kanan untuk menaruhnya. Tarik barang untuk menggeser posisinya, atau tarik ujung kanan bawah barang untuk menyesuaikan ukurannya.'
            ) : (
              <span className="text-red-400 font-semibold">Anda tidak memiliki hak akses untuk mengedit denah lapangan. (Silakan login sebagai panitia).</span>
            )}
          </div>
        </div>

        {/* Denah Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-primary-400" /> Kanvas Tata Letak Lapangan
            </h3>
            <span className="text-slate-500 text-xs">{activeLayoutItems.length} Barang dipasang</span>
          </div>

          {/* Visual Grid Map Canvas */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full h-[500px] relative bg-surface-950 rounded-3xl overflow-hidden border border-white/5 shadow-inner ${canEdit ? 'cursor-crosshair' : 'cursor-not-allowed opacity-80'}`}
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {activeLayoutItems.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-center p-6 pointer-events-none">
                <LayoutGrid className="w-12 h-12 mb-2" />
                <p className="text-sm font-medium">Kanvas Sesi Ini Kosong</p>
                <p className="text-xs max-w-xs mt-1">Klik langsung pada area ini untuk menempatkan barang pilihan Anda, lalu seret untuk memindahkan atau atur ukuran langsung.</p>
              </div>
            ) : (
              activeLayoutItems.map((item) => {
                const typeObj = ITEM_TYPES.find((t) => t.value === item.type);
                const colorClass = typeObj ? typeObj.color : 'bg-slate-600';
                
                // Use default size if not stored in firestore
                let defaultWidth = 120;
                let defaultHeight = 50;
                if (item.type === 'stage') { defaultWidth = 180; defaultHeight = 80; }
                else if (item.type === 'sound') { defaultWidth = 60; defaultHeight = 60; }
                else if (item.type === 'table') { defaultWidth = 140; defaultHeight = 50; }
                else if (item.type === 'chair') { defaultWidth = 45; defaultHeight = 45; }

                const itemWidth = item.width || defaultWidth;
                const itemHeight = item.height || defaultHeight;

                return (
                  <div
                    key={item.id}
                    style={{
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      width: `${itemWidth}px`,
                      height: `${itemHeight}px`,
                      resize: canEdit ? 'both' : 'none',
                      overflow: 'hidden',
                      minWidth: '35px',
                      minHeight: '35px',
                    }}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onMouseUp={(e) => canEdit && handleResizeEnd(e, item.id)}
                    className={`absolute rounded-xl border p-2 text-[10px] font-bold text-white ${colorClass} flex flex-col justify-between shadow-lg group cursor-grab active:cursor-grabbing select-none`}
                    onClick={(e) => e.stopPropagation()} // Stop click-to-add trigger on canvas
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="truncate pr-1">{item.text}</span>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Hapus ${item.text} dari denah?`)) deleteFloorItem(item.id);
                          }}
                          className="p-0.5 text-white/50 hover:text-red-300 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Hapus barang"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Small dimension text at bottom */}
                    <div className="text-[8px] text-white/40 font-mono tracking-tighter select-none pointer-events-none">
                      {itemWidth} x {itemHeight}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
