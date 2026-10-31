import { CrochetColorworkView, crochetColorworkMetadata } from "@/views/CrochetColorworkViews";

export const metadata = crochetColorworkMetadata("en");

export default function Page() {
  return <CrochetColorworkView locale="en" />;
}
