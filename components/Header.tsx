"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";

function Header() {
  return (
    <div className="border-b">
      <div className="flex flex-row items-center gap-4 p-4">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link href="/" className="font-bold shrink-0">
            LOGO
          </Link>
        </div>

        <div className="lg:block ml-auto">
          <Authenticated>
            <div className="flex items-center gap-3">
              <UserButton />
            </div>
          </Authenticated>

          <Unauthenticated>
            <SignInButton mode="modal">
              <button className="bg-gray-100 text-gray-800 min-w-24 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
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
