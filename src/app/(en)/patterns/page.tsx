import { PatternsView, patternsMetadata } from "@/views/PatternViews";

export const metadata = patternsMetadata("en");

export default function Page() {
  return <PatternsView locale="en" />;
}
