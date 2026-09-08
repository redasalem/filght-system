'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

interface HeaderProps {
  onOpenConcierge?: () => void;
  onOpenBookings?: () => void;
}

export default function Header({ onOpenConcierge, onOpenBookings }: HeaderProps) {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full border-b border-[rgba(28,26,20,0.12)] bg-[#f3ecd6] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="notary-mark" />
            <span className="font-display text-2xl md:text-3xl font-normal tracking-tight text-[#1c1a14]">
              AEROFLOW
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[rgba(28,26,20,0.12)]">
            <span className="ui-caption text-[#6b6759] border border-[rgba(28,26,20,0.12)] px-2 py-0.5 rounded-[2px] bg-[#ebe4cf]">
              FLEET 787-9 & A350
            </span>
            <span className="ui-caption text-[#244232] font-semibold">
              DIRECT-CARRIER
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#schedule"
            className="ui-label text-[#6b6759] hover:text-[#1c1a14] transition-colors"
          >
            Schedule
          </Link>
          <button
            onClick={() => {
              if (onOpenConcierge) {
                onOpenConcierge();
              } else {
                const el = document.getElementById('concierge-trigger');
                el?.click();
              }
            }}
            className="ui-label text-[#6b6759] hover:text-[#1c1a14] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#244232]" />
            AI Concierge
          </button>
          <button
            onClick={() => {
              if (onOpenBookings) {
                onOpenBookings();
              } else {
                const el = document.getElementById('bookings-trigger');
                el?.click();
              }
            }}
            className="ui-label text-[#6b6759] hover:text-[#1c1a14] transition-colors cursor-pointer"
          >
            My Bookings
          </button>
        </nav>

        {/* Right Auth CTA */}
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline ui-caption text-[#6b6759]">
                VERIFIED PASSENGER
              </span>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 rounded-[3px] border border-[rgba(28,26,20,0.18)]',
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="btn-secondary !py-2 !px-4 !text-xs">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary !py-2 !px-4 !text-xs">
                  Register
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
