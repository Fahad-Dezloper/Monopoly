import { Suspense } from "react";
import type { Metadata } from "next";
import { MockStudio } from "@/components/mock/MockStudio";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Mock studio",
  description: `Design surface for ${BRAND.name} — no server, no sockets.`,
  robots: { index: false, follow: false },
};

export default function MockPage() {
  // MockStudio reads the query string, which opts a prerendered route into
  // client rendering; without this boundary the production build fails.
  return (
    <Suspense>
      <MockStudio />
    </Suspense>
  );
}
