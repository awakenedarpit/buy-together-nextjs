import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demo-workspace";

export const metadata: Metadata = { title: "Sample group totals" };

export default function DemoGroupPage() {
  return <DemoWorkspace view="group" />;
}
