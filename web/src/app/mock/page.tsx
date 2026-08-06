import type { Metadata } from "next";
import { MockStudio } from "@/components/mock/MockStudio";

export const metadata: Metadata = {
  title: "Robinverse — mock studio",
  robots: { index: false, follow: false },
};

export default function MockPage() {
  return <MockStudio />;
}
