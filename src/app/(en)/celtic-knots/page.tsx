import { CelticKnotView, celticKnotMetadata } from "@/views/CelticKnotView";

export const metadata = celticKnotMetadata("en");

export default function Page() {
  return <CelticKnotView locale="en" />;
}
