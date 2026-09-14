import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Chatbot from "@/components/Chatbot";
import Sidebar from "@/components/Sidebar";
import { base44 } from "@/api/base44Client";

export default function Layout() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed); }, []);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {authed && <Sidebar />}
      <main className={`flex-1 min-w-0 ${authed ? "md:pl-16" : ""}`}>
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
      <Chatbot />
    </div>
  );
}