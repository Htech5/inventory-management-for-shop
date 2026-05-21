"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  apiRequest,
  clearAuthSession,
  formatIndonesianDate,
  getStoredToken,
} from "@/lib/client-api";

function normalizeItem(item) {
  return {
    ...item,
    nama: item.nama ?? item.name,
    stok: item.stok ?? item.stock ?? 0,
  };
}

function normalizeTransaction(item) {
  return {
    ...item,
    tanggal: formatIndonesianDate(item.created_at ?? item.tanggal),
    nama: item.nama ?? item.item_name,
    jumlah: item.jumlah ?? item.quantity,
  };
}

export default function StokMasukPage() {
  const router = useRouter();
  const [daftarBarangMaster, setDaftarBarangMaster] = useState([]);
  const [historyMasuk, setHistoryMasuk] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState("");
  const [jumlahMasuk, setJumlahMasuk] = useState("");

  const handleApiError = useCallback(
    (apiError) => {
      if (apiError.status === 401) {
        clearAuthSession();
        router.replace("/login");
        return;
      }

      setError(
        apiError.message || "Terjadi kesalahan saat menghubungi server.",
      );
    },
    [router],
  );

  const loadPageData = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [itemsResponse, transactionsResponse] = await Promise.all([
        apiRequest("/api/items"),
        apiRequest("/api/stock/transactions?type=in"),
      ]);
      const items = itemsResponse.data.map(normalizeItem);

      setDaftarBarangMaster(items);
      setHistoryMasuk(transactionsResponse.data.map(normalizeTransaction));
      setSelectedBarang((previous) => previous || items[0]?.id || "");
    } catch (apiError) {
      handleApiError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }

    const timeoutId = setTimeout(() => {
      loadPageData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadPageData, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedBarang) {
      alert("Pilih barang terlebih dahulu!");
      return;
    }

    if (!jumlahMasuk || Number(jumlahMasuk) <= 0) {
      alert("Masukkan jumlah kuantitas stok yang valid!");
      return;
    }

    try {
      await apiRequest("/api/stock/transactions", {
        method: "POST",
        body: JSON.stringify({
          item_id: selectedBarang,
          type: "in",
          quantity: Number(jumlahMasuk),
        }),
      });

      await loadPageData();
      setIsOpen(false);
      setJumlahMasuk("");
    } catch (apiError) {
      handleApiError(apiError);
      alert(apiError.message || "Transaksi gagal diproses.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        <Header title="Stok Masuk" />

        <main className="p-6 pb-24 md:pb-6 flex-1 w-full max-w-6xl mx-auto font-['Segoe_UI']">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div>
              <p className="text-sm text-[#6B7280]">
                Catat penambahan stok barang yang sudah ada.
              </p>
            </div>
            <button
              onClick={() => {
                if (daftarBarangMaster.length === 0) {
                  alert(
                    "Data master barang kosong! Sila ditambah di halaman Data Barang terlebih dahulu.",
                  );
                  return;
                }
                setIsOpen(true);
              }}
              className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-600 text-white text-sm font-semibold px-5 h-10 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span className="text-base font-bold">+</span> Tambah Stok Barang
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#F3F4F6] p-8 text-center text-gray-400">
              Memuat transaksi dari Supabase...
            </div>
          ) : (
            <>
              <div className="hidden sm:block bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden w-full">
                <table className="w-full border-collapse text-left text-sm min-w-150">
                  <thead className="bg-[#F9FAFB] text-[12px] font-bold tracking-wider text-[#6B7280] uppercase border-b border-[#F3F4F6]">
                    <tr>
                      <th className="py-4 px-4 w-16 text-center">No</th>
                      <th className="py-4 px-6 w-44">Tanggal</th>
                      <th className="py-4 px-6">Nama Barang</th>
                      <th className="py-4 px-4 w-40 text-center">Stok Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {historyMasuk.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-10 text-center text-gray-400"
                        >
                          Belum ada transaksi barang masuk.
                        </td>
                      </tr>
                    ) : (
                      historyMasuk.map((item, index) => (
                        <tr
                          key={item.id ?? index}
                          className="hover:bg-slate-50/40 h-16.25 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-[#9CA3AF]">
                            {index + 1}
                          </td>
                          <td className="py-3 px-6 text-[#6B7280]">
                            {item.tanggal}
                          </td>
                          <td className="py-3 px-6 font-semibold text-[#111827]">
                            {item.nama}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex justify-center items-center h-7 px-3 rounded-lg text-sm font-bold bg-[#ECFDF5] text-[#10B981]">
                              +{item.jumlah}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:hidden gap-3">
                {historyMasuk.length === 0 ? (
                  <div className="bg-white p-8 text-center text-gray-400 rounded-2xl border border-[#F3F4F6]">
                    Belum ada transaksi barang masuk.
                  </div>
                ) : (
                  historyMasuk.map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="bg-white p-4 rounded-2xl border border-[#F3F4F6] shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-[#6B7280]">
                          {item.tanggal}
                        </span>
                        <span className="inline-flex justify-center items-center h-6 px-2.5 rounded-lg text-xs font-bold bg-[#ECFDF5] text-[#10B981]">
                          +{item.jumlah}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#111827] text-sm leading-snug">
                        {item.nama}
                      </h4>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white border border-[#F3F4F6] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 pb-0 flex justify-between items-center">
              <h3 className="text-[20px] font-bold text-[#111827] font-['Segoe_UI']">
                Catat Stok Masuk
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-[#F9FAFB] rounded-full flex items-center justify-center text-[#9CA3AF] hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151] font-['Segoe_UI']">
                  Pilih Barang
                </label>
                <select
                  value={selectedBarang}
                  onChange={(e) => setSelectedBarang(e.target.value)}
                  className="w-full h-[41.66px] px-4 border border-[#D1D5DB] rounded-xl text-sm text-slate-800 bg-white focus:outline-none"
                >
                  {daftarBarangMaster.map((barang) => (
                    <option key={barang.id} value={barang.id}>
                      {barang.nama} - stok {barang.stok}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151] font-['Segoe_UI']">
                  Jumlah Barang Masuk
                </label>
                <input
                  type="number"
                  value={jumlahMasuk}
                  onChange={(e) => setJumlahMasuk(e.target.value)}
                  placeholder="Contoh: 50"
                  className="w-full h-[41.33px] px-4 border border-[#D1D5DB] rounded-xl text-sm text-slate-800 placeholder-[#9CA3AF] focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="bg-[#F9FAFB] p-4 px-6 flex justify-end gap-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-[41.33px] px-5 border border-[#D1D5DB] rounded-xl text-sm font-semibold text-[#4B5563] bg-white hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-[41.33px] px-5 rounded-xl text-sm font-semibold text-white bg-[#10B981] hover:bg-emerald-600 shadow-md cursor-pointer"
              >
                Tambah Stok
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
