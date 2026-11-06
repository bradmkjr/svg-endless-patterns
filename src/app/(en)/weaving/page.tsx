import { WeavingView, weavingMetadata } from "@/views/WeavingView";

export const metadata = weavingMetadata("en");

export default function Page() {
  return <WeavingView locale="en" />;
}
