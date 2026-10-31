import { StitchesView, stitchesMetadata } from "@/views/StitchViews";

export const metadata = stitchesMetadata("en", "knit");

export default function Page() {
  return <StitchesView locale="en" craft="knit" />;
}
