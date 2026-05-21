"use client";

export default function TableData({ barangList, onTriggerModal }) {
  return (
    <div className="w-full flex flex-col font-['Segoe_UI']">
      {/* KONTROL UTAMA ATAS: Menggunakan flex-col di HP dan flex-row di Laptop */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        {/* Teks Deskripsi otomatis disembunyikan di HP agar tombol tidak tergencet */}
        <div className="hidden sm:block">
          <p className="text-sm text-[#6B7280]">
            Kelola semua data barang dan total stok saat ini.
          </p>
        </div>

        {/* Tombol Tambah otomatis melebar penuh (w-full) di HP agar mudah diketuk */}
        <button
          onClick={() => onTriggerModal("add", "")}
          className="w-full sm:w-auto bg-[#212C3E] hover:bg-[#192230] text-white text-sm font-semibold px-5 h-10 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span className="text-base font-bold">+</span> Tambah Data Barang
        </button>
      </div>

      {/* ==================================================================== */}
      {/* VIEW A: TAMPILAN TABEL DESKTOP (Muncul hanya di layar Laptop / Tablet) */}
      {/* ==================================================================== */}
      <div className="hidden sm:block bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm min-w-150">
            <thead className="bg-[#F9FAFB] text-[12px] font-bold tracking-wider text-[#6B7280] uppercase border-b border-[#F3F4F6]">
              <tr>
                <th className="py-4 px-4 w-16 text-center">No</th>
                <th className="py-4 px-6">Nama Barang</th>
                <th className="py-4 px-4 w-32 text-center">Total Stok</th>
                <th className="py-4 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {barangList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-400">
                    Tidak ada data barang. Silakan tambah barang baru.
                  </td>
                </tr>
              ) : (
                barangList.map((barang, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/40 h-16.25 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-[#9CA3AF]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-6 font-semibold text-[#111827]">
                      {barang.nama}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex justify-center items-center h-7 px-3 rounded-lg text-sm font-bold ${
                          barang.stok === 0
                            ? "bg-[#FEF2F2] text-[#DC2626]"
                            : "bg-[#F3F4F6] text-[#374151]"
                        }`}
                      >
                        {barang.stok}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() =>
                            onTriggerModal(
                              "edit",
                              barang.nama,
                              barang.stok,
                              barang.id,
                            )
                          }
                          className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            onTriggerModal(
                              "delete",
                              barang.nama,
                              barang.stok,
                              barang.id,
                            )
                          }
                          className="w-8 h-8 bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW B: TAMPILAN LIST CARD MOBILE (Muncul khusus di layar HP / Kecil) */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:hidden gap-3">
        {barangList.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 rounded-2xl border border-[#F3F4F6]">
            Tidak ada data barang. Silakan tambah barang baru.
          </div>
        ) : (
          barangList.map((barang, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-2xl border border-[#F3F4F6] shadow-xs flex flex-col gap-4"
            >
              {/* Info Atas Card */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-[#9CA3AF] mt-0.5">
                    #{index + 1}
                  </span>
                  <h4 className="font-semibold text-[#111827] text-sm leading-snug">
                    {barang.nama}
                  </h4>
                </div>

                {/* Badge Total Stok */}
                <span
                  className={`inline-flex shrink-0 justify-center items-center h-7 px-2.5 rounded-lg text-xs font-bold ${
                    barang.stok === 0
                      ? "bg-[#FEF2F2] text-[#DC2626]"
                      : "bg-[#F3F4F6] text-[#374151]"
                  }`}
                >
                  {barang.stok}
                </span>
              </div>

              {/* Tombol Aksi HP (Lebar seimbang & mudah ditekan jempol) */}
              <div className="flex gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={() =>
                    onTriggerModal("edit", barang.nama, barang.stok, barang.id)
                  }
                  className="flex-1 h-9 bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center gap-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() =>
                    onTriggerModal(
                      "delete",
                      barang.nama,
                      barang.stok,
                      barang.id,
                    )
                  }
                  className="flex-1 h-9 bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center gap-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
