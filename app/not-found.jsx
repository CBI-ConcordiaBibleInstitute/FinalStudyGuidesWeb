import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-cb flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-[9rem] font-bold leading-none text-maroon opacity-30">
        404
      </p>
      <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-maroon text-white">
        <Compass size={36} />
      </div>
      <h1 className="mt-7 font-serif text-4xl font-bold text-ink sm:text-5xl">
        This page wandered off
      </h1>
      <p className="mt-3 max-w-md text-lg text-ink">
        We couldn't find what you were looking for. Let's get you back to the
        Word.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/podcasts" className="btn-ghost">
          Browse podcasts
        </Link>
      </div>
    </div>
  );
}
