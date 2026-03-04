'use client';

import './globals.css';
import React from 'react';
import Header from '../components/ui/Header';
import { AuthProvider } from '../lib/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>AI Guardian</title>
        <meta name="description" content="AI Governance & Audit Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="bg-[#111113] min-h-screen text-[#EDEDEF] font-sans">
        <AuthProvider>
          <Header />
          <main className="animate-fade-in">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
