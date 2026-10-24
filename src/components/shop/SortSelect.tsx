"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-[15px]">
      Sort
      <select
        value={value}
        data-testid="sort"
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set("sort", e.target.value);
          next.delete("page");
          router.push(`${path}?${next}`);
        }}
        className="h-10 bg-[var(--color-surface-2)] px-3 text-[15px] text-[var(--color-fg)]"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price, low to high</option>
        <option value="price-desc">Price, high to low</option>
        <option value="rating">Rating</option>
      </select>
    </label>
  );
}
