import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { SOSModal } from '../components/emergency/SOSModal';
import { ToastContainer } from '../components/common/ToastContainer';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onOpenSOS={() => setIsSOSOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-16 lg:pb-8">
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onOpenSOS={() => setIsSOSOpen(true)} />
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <ToastContainer />
    </div>
  );
};
