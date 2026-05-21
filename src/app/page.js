"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TableData from "@/components/TableData";
import BaseModal from "@/components/BaseModal";
import {
  apiRequest,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
} from "@/lib/client-api";

function normalizeItem(item) {
  return {
    ...item,
    nama: item.nama ?? item.name,
    stok: item.stok ?? item.stock ?? 0,
  };
}

export default function DataBarangPage() {
  const router = useRouter();
  const [barangList, setBarangList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [user] = useState(() => getStoredUser());

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "add",
    currentId: null,
    currentName: "",
    currentStok: 0,
  });

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

  const loadItems = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/items");
      setBarangList(response.data.map(normalizeItem));
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
      loadItems();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadItems, router]);

  const openModalHandler = (type, name, stok = 0, id = null) => {
    if (user?.role !== "admin") {
      alert(
        "Hanya Admin yang dapat menambah, mengubah, atau menghapus data barang.",
      );
      return;
    }

    setModalState({
      isOpen: true,
      type,
      currentId: id,
      currentName: name,
      currentStok: stok,
    });
  };

  const closeModalHandler = () => {
    setModalState((previous) => ({ ...previous, isOpen: false }));
  };

  const handleConfirmAction = async (inputData) => {
    setError("");

    try {
      const { type, currentId } = modalState;

      if (type === "add") {
        const response = await apiRequest("/api/items", {
          method: "POST",
          body: JSON.stringify({ nama: inputData.nama, stok: inputData.stok }),
        });
        setBarangList((previous) => [
          normalizeItem(response.data),
          ...previous,
        ]);
      } else if (type === "edit") {
        const response = await apiRequest(`/api/items/${currentId}`, {
          method: "PATCH",
          body: JSON.stringify({ nama: inputData.nama, stok: inputData.stok }),
        });
        setBarangList((previous) =>
          previous.map((barang) =>
            barang.id === currentId ? normalizeItem(response.data) : barang,
          ),
        );
      } else if (type === "delete") {
        await apiRequest(`/api/items/${currentId}`, { method: "DELETE" });
        setBarangList((previous) =>
          previous.filter((barang) => barang.id !== currentId),
        );
      }

      closeModalHandler();
    } catch (apiError) {
      handleApiError(apiError);
      alert(apiError.message || "Aksi gagal diproses.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        <Header title="Data Barang" />

        <main className="p-6 pb-24 md:pb-6 flex-1 w-full max-w-6xl mx-auto">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#F3F4F6] p-8 text-center text-gray-400">
              Memuat data barang dari Supabase...
            </div>
          ) : (
            <TableData
              barangList={barangList}
              onTriggerModal={openModalHandler}
            />
          )}
        </main>
      </div>

      <BaseModal
        key={`${modalState.isOpen}-${modalState.type}-${modalState.currentId}-${modalState.currentName}`}
        isOpen={modalState.isOpen}
        type={modalState.type}
        currentName={modalState.currentName}
        currentStok={modalState.currentStok}
        onClose={closeModalHandler}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
