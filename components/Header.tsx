"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";

function Header() {
  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between p-4">
        {/* Left - Logo */}
        <Link href="/" className="font-bold text-lg">
          LOGO
        </Link>

        {/* Right - Auth & Mode Toggle */}
        <div className="flex items-center gap-4">
          <ModeToggle />

          <Authenticated>
            <UserButton />
          </Authenticated>

          <Unauthenticated>
            <SignInButton mode="modal">
              <button className="bg-black text-white dark:bg-white dark:text-black text-foreground px-4 py-2 rounded-lg text-sm border border-transparent dark:border-black hover:opacity-80 transition">
                Sign In
              </button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </div>
    </div>
  );
}

export default Header;
