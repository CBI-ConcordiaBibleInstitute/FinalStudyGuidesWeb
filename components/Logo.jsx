import Image from "next/image";

// Official Concordia Bible Institute logo, rendered as a round seal to match
// concordiabible.org. `size` controls the diameter; legacy `width`/`height`
// callers still work — the larger dimension is used as the diameter.
export default function Logo({ size, width, height, className = "" }) {
  const diameter = size ?? Math.max(width ?? 0, height ?? 0) ?? 56;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-maroon ${className}`}
      style={{ width: diameter, height: diameter }}
    >
      <Image
        src="/concordia-logo.jpg"
        alt="Concordia Bible Institute — Christ in Every Word"
        width={diameter}
        height={diameter}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}
