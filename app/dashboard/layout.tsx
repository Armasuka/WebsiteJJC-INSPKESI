"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Menu items berdasarkan role
const menuItems = {
  PETUGAS_LAPANGAN: [
    {
      title: "Dashboard",
      href: "/dashboard/petugas-lapangan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      title: "Inspeksi Kendaraan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      submenu: [
        {
          title: "Plaza",
          href: "/dashboard/petugas-lapangan/inspeksi/plaza",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          title: "Derek",
          href: "/dashboard/petugas-lapangan/inspeksi/derek",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
        },
        {
          title: "Kamtib",
          href: "/dashboard/petugas-lapangan/inspeksi/kamtib",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          title: "Rescue",
          href: "/dashboard/petugas-lapangan/inspeksi/rescue",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Riwayat Inspeksi",
      href: "/dashboard/petugas-lapangan/riwayat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Rekap Laporan",
      href: "/dashboard/petugas-lapangan/rekap-acc",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ],
  MANAGER_TRAFFIC: [
    {
      title: "Dashboard",
      href: "/dashboard/manager-traffic",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ],
  MANAGER_OPERATIONAL: [
    {
      title: "Dashboard",
      href: "/dashboard/manager-operational",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      title: "Rekap Laporan",
      href: "/dashboard/manager-operational/rekap",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Kelola Petugas",
      href: "/dashboard/manager-operational/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Define userRole and currentMenuItems early
  const userRole = (session?.user as any)?.role;
  const currentMenuItems = menuItems[userRole as keyof typeof menuItems] || [];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === pathname) return true;
    if (href !== "/dashboard/petugas-lapangan" && 
        href !== "/dashboard/manager-traffic" && 
        href !== "/dashboard/manager-operational" &&
        pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Auto-open submenu if current page is in submenu
  useEffect(() => {
    currentMenuItems.forEach((item) => {
      if ('submenu' in item && item.submenu) {
        const hasActive = item.submenu.some((sub: any) => isActive(sub.href));
        if (hasActive && !openSubmenu) {
          setOpenSubmenu(item.title);
        }
      }
    });
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      MANAGER_TRAFFIC: "Manager Traffic",
      MANAGER_OPERATIONAL: "Manager Operational",
      PETUGAS_LAPANGAN: "Petugas Lapangan",
    };
    return roles[role] || role;
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const hasActiveSubmenu = (submenu?: any[]) => {
    if (!submenu) return false;
    return submenu.some(sub => isActive(sub.href));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - FULL HEIGHT */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-gray-200 text-gray-700 transition-all duration-300 ease-in-out flex flex-col fixed inset-y-0 z-40 shadow-sm
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo Section with Close Button */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-3">
              {/* Close button untuk mobile - di kiri */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Logo - di tengah */}
              <div className="relative w-full max-w-[180px] h-20 transition-all duration-300">
                <Image
                  src="/logo/logo_jjc.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Toggle collapse button - desktop only, di kanan */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Expand sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {currentMenuItems.map((item, index) => {
              const active = isActive(item.href);
              const hasSubmenu = 'submenu' in item && item.submenu;
              const isSubmenuOpen = openSubmenu === item.title;
              const submenuActive = hasActiveSubmenu(hasSubmenu ? item.submenu : undefined);
              
              if (hasSubmenu) {
                // Menu dengan submenu
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                        submenuActive || isSubmenuOpen
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className={`${submenuActive || isSubmenuOpen ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {item.icon}
                      </div>
                      {sidebarOpen && (
                        <>
                          <span className={`font-medium text-sm flex-1 text-left ${submenuActive || isSubmenuOpen ? 'text-blue-600' : 'text-gray-700'}`}>
                            {item.title}
                          </span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                      {!sidebarOpen && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                          {item.title}
                        </div>
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {sidebarOpen && isSubmenuOpen && item.submenu && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem: any, subIndex: number) => {
                          const subActive = isActive(subItem.href);
                          return (
                            <Link
                              key={subIndex}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${
                                subActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <div className={`${subActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {subItem.icon}
                              </div>
                              <span className={`font-medium text-sm ${subActive ? 'text-blue-700' : 'text-gray-600'}`}>
                                {subItem.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Menu biasa tanpa submenu
              return (
                <Link
                  key={index}
                  href={item.href || '#'}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                    active
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <span className={`font-medium text-sm ${active ? 'text-blue-600' : 'text-gray-700'}`}>
                      {item.title}
                    </span>
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                      {item.title}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom - FLEX-SHRINK-0 agar tidak hilang */}
        {sidebarOpen && (
          <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {getRoleDisplay(userRole)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'} transition-all duration-300`}>
        {/* Header - Clean & Professional */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Mobile Menu Button & Page Title */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Hamburger Menu - Mobile Only */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {currentMenuItems.find(item => isActive(item.href))?.title || 'Dashboard'}
                </h2>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* User Profile Badge - Hidden on small mobile */}
                <div className="hidden sm:block bg-gray-50 px-3 sm:px-4 py-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
                      {session?.user?.name}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow flex items-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              © 2025 PT Jasa Marga (Persero) Tbk. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancelLogout}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-scaleIn">
            {/* Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                Konfirmasi Logout
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Apakah Anda yakin ingin keluar dari sistem? 
                <br className="hidden sm:block" />
                Anda perlu login kembali untuk mengakses dashboard.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg text-sm sm:text-base"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

