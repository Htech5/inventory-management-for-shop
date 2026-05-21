"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthSession } from "@/lib/client-api";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const menuItems = [
    { name: "Data Barang", path: "/" },
    { name: "Stok Masuk", path: "/stok-masuk" },
    { name: "Stok Keluar", path: "/stok-keluar" },
  ];

  return (
    <>
      {/* 1. SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#212C3E] text-white p-4 justify-between z-30 shadow-2xl">
        <div>
          {/* Logo Brand Desktop */}
          <div className="flex items-center gap-2.5 py-4 px-1 border-b border-white/10 h-20">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center p-1 shrink-0">
              <svg
                className="w-6 h-6 text-[#212C3E]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L7 5v4l5 3 5-3V5l-5-3zm-6 9l-5 3v4l5 3 5-3v-4l-5-3zm12 0l-5 3v4l5 3 5-3v-4l-5-3z" />
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight leading-tight font-['Segoe_UI']">
              Inventory Management for Shop
            </span>
          </div>

          <nav className="flex flex-col gap-2 mt-6">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all font-['Segoe_UI'] ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tombol Logout Desktop */}
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-red-400 transition-all font-['Segoe_UI'] text-left cursor-pointer"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. BOTTOM NAVIGATION MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#212C3E] border-t border-white/10 flex justify-around items-center text-white z-40 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center text-[13px] h-full font-['Segoe_UI'] ${
                isActive
                  ? "text-white font-bold border-b-2 border-white/40"
                  : "text-gray-400"
              }`}
            >
              <span>{item.name.replace("Data ", "")}</span>
            </Link>
          );
        })}
        {/* PERBAIKAN MOBILE: Mengubah <Link> menjadi <button> dengan onClick agar memicu pop-up konfirmasi */}
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="flex flex-col items-center justify-center text-[13px] h-full text-gray-400 font-['Segoe_UI'] cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-red-400 shrink-0 mb-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
            />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      {/* 3. JENDELA POP-UP LOGOUT (MODAL) */}
      {isLogoutOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-90 bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center text-[#212C3E]">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <h3 className="text-[20px] font-bold text-[#111827] font-['Segoe_UI']">
                Akhiri Sesi?
              </h3>
              <p className="text-sm text-[#6B7280] font-['Segoe_UI'] px-1 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sistem Inventory Management
                for Shop? Anda harus login kembali untuk masuk.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => {
                  setIsLogoutOpen(false);
                  clearAuthSession();
                  router.push("/login");
                }}
                className="w-full h-10 bg-[#212C3E] hover:bg-[#192230] text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer transition-colors"
              >
                Ya, Logout
              </button>
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="w-full h-10 bg-[#F3F4F6] text-[#4B5563] hover:bg-gray-200 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
