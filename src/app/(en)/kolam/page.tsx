import { KolamView, kolamMetadata } from "@/views/KolamView";

export const metadata = kolamMetadata("en");

export default function Page() {
  return <KolamView locale="en" />;
}
