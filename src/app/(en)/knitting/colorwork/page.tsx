import { KnitColorworkView, knitColorworkMetadata } from "@/views/KnitColorworkViews";

export const metadata = knitColorworkMetadata("en");

export default function Page() {
  return <KnitColorworkView locale="en" />;
}
