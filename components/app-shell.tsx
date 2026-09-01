"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { HealthTipPopup } from "./HealthTipPopup";
import { getPendingHealthTip, markHealthTipSeen } from "@/lib/health-tips";
import { playHealthTipSound } from "@/lib/notification-sound";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [healthTip, setHealthTip] = useState<ReturnType<typeof getPendingHealthTip>>(null);
  const healthTipSoundPlayed = useRef(false);

  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  useEffect(() => {
    const pendingTip = getPendingHealthTip();
    setHealthTip(pendingTip);
    if (pendingTip && !healthTipSoundPlayed.current) {
      playHealthTipSound();
      healthTipSoundPlayed.current = true;
    }
  }, []);

  const dismissHealthTip = () => {
    if (healthTip) {
      markHealthTipSeen(healthTip.id);
    }
    setHealthTip(null);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <HealthTipPopup tip={healthTip} onDismiss={dismissHealthTip} />
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="relative flex flex-col lg:flex-row">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
          <div className="min-w-0">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
