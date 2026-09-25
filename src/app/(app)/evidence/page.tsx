import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function EvidencePage() {
  redirect("/capture?view=analysis#evidence");
}
