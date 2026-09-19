"use client";

import { CircleHub } from "@/components/hangouts/CircleHub";
import { useParams } from "next/navigation";

export default function CircleHubPage() {
  const params = useParams<{ id: string }>();
  return <CircleHub circleId={params.id} />;
}
