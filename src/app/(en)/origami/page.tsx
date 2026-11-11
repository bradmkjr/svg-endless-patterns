import { OrigamiView, origamiMetadata } from "@/views/OrigamiView";

export const metadata = origamiMetadata("en");

export default function Page() {
  return <OrigamiView locale="en" />;
}
