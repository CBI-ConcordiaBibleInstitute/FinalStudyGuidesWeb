import "./globals.css";
import { Roboto_Slab, Roboto } from "next/font/google";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import { SITE } from "@/lib/catalog-shared";

// Typography matched to concordiabible.org — Roboto Slab for headings,
// Roboto for body (closest current Google equivalent of the retired
// Droid Serif used in their original theme).
const serif = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});
const body = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://concordiastudyguides.com"),
  title: {
    default: `${SITE.name} — Premium Bible Study Guides & Podcast`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Study the whole counsel of Scripture with the Christ in Every Word podcast and 300+ downloadable study guides from Concordia Bible Institute.",
  keywords: [
    "Bible study guides",
    "Concordia Bible Institute",
    "Christ in Every Word",
    "Lutheran Bible study",
    "podcast study guides",
  ],
  openGraph: {
    title: `${SITE.name} — Premium Bible Study Guides`,
    description: SITE.tagline,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#660e1b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${body.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-white">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-maroon focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
