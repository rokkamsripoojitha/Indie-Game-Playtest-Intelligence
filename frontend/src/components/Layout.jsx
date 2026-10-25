import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SystemHealthBanner } from './SystemHealthBanner';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <SystemHealthBanner />
      <Navbar />
      <div className="flex-1 flex">
        {isLoggedIn && <Sidebar />}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
