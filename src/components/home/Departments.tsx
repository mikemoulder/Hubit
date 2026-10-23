"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sized } from "@/lib/format";

export type DeptRow = { id: string; label: string; count: number; fromCents: string; blurb: string; image: string };

/**
 * The departments as a list beside one held photograph. The row nearest the middle
 * of the screen (or under the pointer, or focused) is the active one: its picture
 * shows and its line of brands opens.
 */
export function Departments({ rows }: { rows: DeptRow[] }) {
  const [on, setOn] = useState<string | undefined>(rows[0]?.id);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = list.current?.querySelectorAll<HTMLElement>("[data-dept]");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setOn((e.target as HTMLElement).dataset.dept);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="depts wrap" aria-labelledby="depts-title">
      <div className="depts__photo" aria-hidden>
        {rows.map((r) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={r.id} src={sized(r.image, 900)} alt="" loading="lazy" data-on={on === r.id} />
        ))}
      </div>
      <div className="depts__list" ref={list}>
        <h2 id="depts-title" className="font-semibold tracking-[-0.02em]" data-reveal>
          Ten departments
        </h2>
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/shop?dept=${r.id}`}
            className="depts__row"
            data-dept={r.id}
            data-on={on === r.id}
            onMouseEnter={() => setOn(r.id)}
            onFocus={() => setOn(r.id)}
          >
            <span className="depts__name">
              <span>{r.label}</span>
              <small>
                {r.count} from {r.fromCents}
              </small>
            </span>
            <span className="depts__more">
              <span>{r.blurb}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
