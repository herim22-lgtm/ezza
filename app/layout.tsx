import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ezza — Your Money, Made Clear',
  description: 'A financial assistant built for real life and irregular income.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
