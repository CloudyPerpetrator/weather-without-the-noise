import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Weather, Without the Noise',
  description: 'Live city weather and a five-day forecast, powered by Open-Meteo.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
