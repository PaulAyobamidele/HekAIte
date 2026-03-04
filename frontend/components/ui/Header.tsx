'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path || pathname?.startsWith(path + '/');
  }

  function navClass(path: string) {
    return isActive(path)
      ? 'text-[#EDEDEF] font-medium'
      : 'text-[#878593] hover:text-[#EDEDEF] transition-colors duration-150';
  }

  return (
    <header className="sticky top-0 z-50 bg-[#111113]/80 backdrop-blur-sm border-b border-white/[0.06]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7C5CFC] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#EDEDEF]">AI Guardian</span>
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <div className="flex items-center gap-5 mr-6 text-[13px]">
                <Link href="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
                <Link href="/history" className={navClass('/history')}>History</Link>
                <Link href="/policies" className={navClass('/policies')}>Policies</Link>
                <Link href="/audit" className={navClass('/audit')}>Audit</Link>
                <Link href="/settings" className={navClass('/settings')}>API Keys</Link>
              </div>

              <div className="flex items-center gap-3 pl-5 border-l border-white/[0.06]">
                <div className="w-6 h-6 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center text-[10px] font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] text-[#878593]">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-[13px] text-[#56545E] hover:text-[#E5484D] transition-colors duration-150 ml-1"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-[13px] text-[#878593] hover:text-[#EDEDEF] transition-colors px-3 py-1.5">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-[13px] px-4 py-1.5 rounded-lg">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
