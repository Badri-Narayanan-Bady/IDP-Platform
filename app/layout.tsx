import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'CortexIDP - Intelligent Document Processing Platform',
  description: 'Production-grade AI pipeline that extracts structured information from invoices, contracts, forms, and business documents with confidence scoring, deterministic validation, and human-in-the-loop review workflows.',
  openGraph: {
    title: 'CortexIDP - Intelligent Document Processing Platform',
    description: 'Production-grade AI pipeline that extracts structured information from invoices, contracts, forms, and business documents with confidence scoring, deterministic validation, and human-in-the-loop review workflows.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CortexIDP - Intelligent Document Processing Platform',
    description: 'Production-grade AI pipeline that extracts structured information from invoices, contracts, forms, and business documents with confidence scoring, deterministic validation, and human-in-the-loop review workflows.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
