import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/png_logo_1.png"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg- [var(--color-primary)]  px-6 py-4">
      <div className="max-w-9/10  mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          

          <Link to="/room" className="flex items-center gap-3 text-[#ebe0e0]">
            <img src={logo} alt="logo" className="h-18 w-auto" />
            {/* <span className="hidden sm:inline text-3xl font-semibold">Route</span> */}
          </Link>
        </div>

      </div>
    </header>
  );
}
