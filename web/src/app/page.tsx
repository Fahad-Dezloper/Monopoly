import { Suspense } from "react";
import { RobinverseApp } from "@/components/RobinverseApp";

export default function Home() {
  return (
    <Suspense>
      <RobinverseApp />
    </Suspense>
  );
}
