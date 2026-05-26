import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import SearchClient from "@/components/SearchClient";

export const metadata = {
  title: "Search the Library",
  description: "Search 319 study guides and podcast episodes by keyword.",
};

export default function SearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Find a Study"
        title="Search the library"
        subtitle="Search across 319 study guides and 22 series — by book, passage, or theme."
      />
      <div className="container-cb py-16 sm:py-20">
        <Suspense fallback={<p className="text-ink">Loading search…</p>}>
          <SearchClient />
        </Suspense>
      </div>
    </>
  );
}
