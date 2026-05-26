import PageHeader from "@/components/PageHeader";

// Renders a simple legal/policy document from structured sections.
export default function LegalLayout({ title, updated, intro, sections }) {
  return (
    <>
      <PageHeader eyebrow="Legal" title={title} subtitle={`Last updated: ${updated}`} />
      <div className="container-cb section">
        <div className="mx-auto max-w-3xl">
          {intro && (
            <p className="text-lg leading-relaxed text-ink">{intro}</p>
          )}
          {sections.map((s, i) => (
            <section key={s.heading} className="mt-12">
              <h2 className="font-serif text-3xl font-bold text-ink">
                <span className="text-maroon">{i + 1}.</span> {s.heading}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-ink">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
