"use client";
import { useState } from "react"; // Impor useEffect sudah dihapus karena tidak diperlukan lagi

export default function BaseModal({ isOpen, onClose, type, currentName, currentStok, onConfirm }) {
  // PERBAIKAN UTAMA: Inisialisasi data langsung dari props tanpa memicu cascading render
  const [namaBarang, setNamaBarang] = useState(type === "edit" ? currentName : "");
  const [stokAwal, setStokAwal] = useState(type === "edit" ? currentStok : 0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (type === "delete") {
      onConfirm();
      return;
    }
    if (!namaBarang.trim()) {
      alert("Nama barang tidak boleh kosong!");
      return;
    }
    onConfirm({ nama: namaBarang, stok: Number(stokAwal) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white border border-[#F3F4F6] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* LAYOUT INPUT: TAMBAH & EDIT */}
        {(type === "add" || type === "edit") && (
          <>
            <div className="p-6 pb-0 flex justify-between items-center">
              <h3 className="text-[20px] font-bold text-[#111827] font-['Segoe_UI']">
                {type === "add" ? "Tambah Barang Baru" : "Edit Data Barang"}
              </h3>
              <button onClick={onClose} className="w-8 h-8 bg-[#F9FAFB] rounded-full flex items-center justify-center text-[#9CA3AF] hover:bg-gray-100 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151] font-['Segoe_UI']">Nama Barang</label>
                <input 
                  type="text" 
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Masukkan nama barang..." 
                  className="w-full h-[41.66px] px-4 border border-[#D1D5DB] rounded-xl text-sm text-slate-800 placeholder-[#9CA3AF] focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151] font-['Segoe_UI']">
                  {type === "add" ? "Stok Awal" : "Total Stok"}
                </label>
                <input 
                  type="number" 
                  value={stokAwal}
                  onChange={(e) => setStokAwal(e.target.value)}
                  placeholder="0" 
                  className="w-full h-[41.33px] px-4 border border-[#D1D5DB] rounded-xl text-sm text-slate-800 placeholder-[#9CA3AF] focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="bg-[#F9FAFB] p-4 px-6 flex justify-end gap-3 border-t border-gray-50">
              <button onClick={onClose} className="h-[41.33px] px-5 border border-[#D1D5DB] rounded-xl text-sm font-semibold text-[#4B5563] bg-white hover:bg-gray-50 cursor-pointer">
                Batal
              </button>
              <button 
                onClick={handleSubmit} 
                className={`h-[41.33px] px-5 rounded-xl text-sm font-semibold text-white shadow-md cursor-pointer ${
                  type === "add" ? "bg-[#212C3E] hover:bg-[#192230]" : "bg-[#2563EB] hover:bg-blue-700"
                }`}
              >
                {type === "add" ? "Simpan Barang" : "Update Data"}
              </button>
            </div>
          </>
        )}

        {/* LAYOUT POP UP: HAPUS */}
        {type === "delete" && (
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center text-[#EF4444]">
              <svg className="w-8.5 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="w-full flex flex-col gap-2">
              <h3 className="text-[20px] font-bold text-[#111827] font-['Segoe_UI']">Hapus Barang?</h3>
              <p className="text-sm text-[#6B7280] font-['Segoe_UI'] px-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">&quot;{currentName}&quot;</span> dari sistem? Data ini tidak dapat dikembalikan.
              </p>
            </div>

            <div className="w-full flex justify-center gap-3 pt-2">
              <button onClick={onClose} className="h-10 px-5 bg-[#F3F4F6] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-gray-200 cursor-pointer w-20">
                Batal
              </button>
              <button onClick={handleSubmit} className="h-10 px-5 bg-[#EF4444] text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-md cursor-pointer">
                Ya, Hapus!
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}