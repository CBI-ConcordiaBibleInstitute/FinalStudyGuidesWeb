import Link from "next/link";
import { BookOpen, Headphones, GraduationCap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { SITE, STATS } from "@/lib/catalog-shared";

export const metadata = { title: "About" };

const VALUES = [
  {
    icon: BookOpen,
    title: "Christ in every word",
    text: "We read all of Scripture as one story that finds its center and fulfillment in Jesus Christ.",
  },
  {
    icon: Headphones,
    title: "Study made accessible",
    text: "Each episode pairs a clear teaching video with a written guide for personal or group study.",
  },
  {
    icon: GraduationCap,
    title: "Depth without barriers",
    text: "Seminary-grade teaching, offered affordably so any believer can grow in the Word.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About the Institute"
        title="Concordia Bible Institute"
        subtitle={`Home of the ${SITE.podcast} podcast, on the campus of ${SITE.campus}.`}
      />
      <div className="container-cb section">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-3xl leading-relaxed text-ink sm:text-4xl">
            The Concordia Bible Institute exists to help believers{" "}
            <em className="text-maroon not-italic">
              read, mark, learn, and inwardly digest
            </em>{" "}
            the sacred Scripture — book by book, chapter by chapter.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-ink">
            What began as a podcast has grown into a library of {STATS.guides}{" "}
            study guides spanning {STATS.podcasts} books of the Bible. Every
            study points to the gospel of Jesus Christ and equips you to teach
            it to others.
          </p>
        </Reveal>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1}>
              <div className="card h-full p-8 transition hover:-translate-y-1 hover:shadow-lift">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon text-white">
                  <v.icon size={26} />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-bold text-ink">
                  {v.title}
                </h3>
                <p className="mt-3 leading-relaxed text-ink">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 text-center">
          <Link href="/podcasts" className="btn-primary">
            Explore the library
          </Link>
        </Reveal>
      </div>
    </>
  );
}
