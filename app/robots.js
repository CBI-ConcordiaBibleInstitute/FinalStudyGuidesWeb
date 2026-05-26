export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://concordiastudyguides.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
