import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'VOA Management System',
    template: '%s | VOA',
  },
  description: 'Voice of Adolescents — Empowering Voices, Building Futures. Official organization management platform.',
  keywords: ['VOA', 'Voice of Adolescents', 'youth organization', 'management system'],
  authors: [{ name: 'Voice of Adolescents' }],
  creator: 'Voice of Adolescents',
  publisher: 'Voice of Adolescents',
  icons: {
    icon: [
      { url: '/voa-logo.svg', type: 'image/svg+xml' },
      { url: '/voa-logo.png', type: 'image/png' },
    ],
    apple: '/voa-logo.png',
    shortcut: '/voa-logo.png',
  },
  openGraph: {
    title: 'VOA Management System',
    description: 'Voice of Adolescents — Empowering Voices, Building Futures.',
    siteName: 'VOA Management System',
    images: [{ url: 'https://res.cloudinary.com/dvqfrm6rc/image/upload/v1775567811/VOA_LOGO_jriqh6.png', width: 512, height: 512, alt: 'VOA Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'VOA Management System',
    description: 'Voice of Adolescents — Empowering Voices, Building Futures.',
    images: ['https://res.cloudinary.com/dvqfrm6rc/image/upload/v1775567811/VOA_LOGO_jriqh6.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
      </body>
    </html>
  );
}
