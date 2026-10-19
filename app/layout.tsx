import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata: Metadata = {title:'Semiconductor Physics Lab',description:'Interactive semiconductor physics simulations for electrical engineering students.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
