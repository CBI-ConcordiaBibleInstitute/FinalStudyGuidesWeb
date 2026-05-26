// Plain page banner — concordiabible.org style. White background, maroon
// slab-serif headline, thin gray underline. No 3D, no gradients.
export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <section className="bg-white">
      <div className="container-cb py-10 sm:py-12">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-maroon">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-maroon sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      <hr className="border-rule" />
    </section>
  );
}
