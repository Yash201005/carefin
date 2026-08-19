"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  ClipboardList,
  IndianRupee,
  Hospital,
  UserCheck,
  TrendingUp,
  Landmark,
  ShieldAlert,
  AlertOctagon,
  FolderOpen,
  Menu,
  X,
  Bell,
  User
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // List of all navigation items in CareFin
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, isImplemented: true },
    { name: "My Insurance", href: "/insurance", icon: FileCheck, isImplemented: true },
    { name: "Claims", href: "/claims", icon: ClipboardList, isImplemented: true },
    { name: "Healthcare Costs", href: "/costs", icon: IndianRupee, isImplemented: true },
    { name: "Hospitals", href: "/hospitals", icon: Hospital, isImplemented: true },
    { name: "Insurance Advisor", href: "/advisor", icon: UserCheck, isImplemented: true },
    { name: "Medical Funding", href: "/funding", icon: TrendingUp, isImplemented: true },
    { name: "Government Schemes", href: "/schemes", icon: Landmark, isImplemented: true },
    { name: "Fraud & Safety", href: "#", icon: ShieldAlert, isImplemented: false },
    { name: "Emergency Assistance", href: "#", icon: AlertOctagon, isImplemented: false },
    { name: "Documents", href: "/documents", icon: FolderOpen, isImplemented: true }
  ];

  // Resolve current active item name
  const currentTab = navItems.find((item) => item.href === pathname)?.name || "CareFin";

  return (
    <div className="min-h-screen bg-bg flex text-text-primary">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-surface border-r border-border min-h-screen">
        {/* Branding header */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-accent-primary">CareFin</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isImplemented) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-secondary hover:bg-bg hover:text-text-primary"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-accent-primary" : "text-text-secondary"} />
                  <span>{item.name}</span>
                </Link>
              );
            } else {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-text-secondary/55 select-none"
                  title="Coming Soon in future specifications"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-text-secondary/45" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[10px] tracking-wide font-medium bg-border px-1.5 py-0.5 rounded text-text-secondary/65">
                    Soon
                  </span>
                </div>
              );
            }
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-border text-center text-[10px] text-text-secondary font-medium select-none">
          CareFin Indian Healthcare Guidance v0.2
        </div>
      </aside>

      {/* 2. Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between bg-surface border-b border-border px-4 sm:px-6 lg:px-8 select-none">
          
          {/* Header left: Tab Title or Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1 rounded hover:bg-bg text-text-secondary hover:text-text-primary"
              aria-label="Open mobile menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {currentTab}
            </h1>
          </div>

          {/* Header right: Notifications & Profile triggers */}
          <div className="flex items-center gap-4">
            <button 
              className="p-1.5 rounded-full hover:bg-bg text-text-secondary hover:text-text-primary relative"
              aria-label="View notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent-primary animate-ping"></span>
            </button>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="rounded-full bg-accent-secondary/10 p-1.5 text-accent-secondary">
                <User size={16} />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-text-secondary">
                Demo User
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-text-primary/40 backdrop-blur-xs select-none">
          <div className="w-64 bg-surface flex flex-col h-full shadow-lg relative animate-slide-in">
            {/* Drawer Close trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-bg text-text-secondary hover:text-text-primary"
              aria-label="Close mobile menu"
            >
              <X size={20} />
            </button>

            {/* Branding */}
            <div className="h-16 flex items-center px-6 border-b border-border">
              <span className="text-xl font-bold tracking-tight text-accent-primary">CareFin</span>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.isImplemented) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                        isActive
                          ? "bg-accent-primary/10 text-accent-primary"
                          : "text-text-secondary hover:bg-bg hover:text-text-primary"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-accent-primary" : "text-text-secondary"} />
                      <span>{item.name}</span>
                    </Link>
                  );
                } else {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-text-secondary/50 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-text-secondary/40" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[9px] tracking-wide font-medium bg-border px-1 py-0.5 rounded text-text-secondary/60">
                        Soon
                      </span>
                    </div>
                  );
                }
              })}
            </nav>
          </div>
          {/* Overlay click to close */}
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

    </div>
  );
}
