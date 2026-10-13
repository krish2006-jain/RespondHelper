import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SOSModal } from '../components/emergency/SOSModal';
import { ToastContainer } from '../components/common/ToastContainer';

export const PublicLayout = () => {
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar onOpenSOS={() => setIsSOSOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <ToastContainer />
    </div>
  );
};
