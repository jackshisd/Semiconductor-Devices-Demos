import type { Metadata } from 'next';
import { siteName } from '../lib/site';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata: Metadata = {
  title: { default: siteName, template: `%s | ${siteName}` },
  description:
    'Lecture slides and interactive semiconductor demos for ECE 121B with Professor Emaminejad.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
