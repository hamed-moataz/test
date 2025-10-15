import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/png_logo_1.png"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg- [var(--color-primary)]  px-6 py-4">
      <div className="max-w-9/10  mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button id="members__button" className="sm:hidden text-white">
            <svg width="24" height="24" fill="#ede0e0" viewBox="0 0 24 24">
              <path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z" />
            </svg>
          </button>

          <Link to="/lobby" className="flex items-center gap-3 text-[#ebe0e0]">
            <img src={logo} alt="logo" className="h-18 w-auto" />
            {/* <span className="hidden sm:inline text-3xl font-semibold">Route</span> */}
          </Link>
        </div>

        <div className="flex items-center gap-6">
      

          <Link to="/lobby" className="bg-[var(--color-secondary)] px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-95 transition">
            Create Room
          </Link>
        </div>
      </div>
    </header>
  );
}
