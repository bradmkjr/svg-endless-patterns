import { StitchesView, stitchesMetadata } from "@/views/StitchViews";

export const metadata = stitchesMetadata("en", "crochet");

export default function Page() {
  return <StitchesView locale="en" craft="crochet" />;
}
