import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'AccessLens · Accessibility Auditor', description: 'Find accessibility barriers, inspect affected elements, and plan fixes.'};
export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
