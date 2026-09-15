import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SFXR — Sound effects for people who make things.',
  description: 'Turn Persian scene descriptions into useful SFX search queries.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
