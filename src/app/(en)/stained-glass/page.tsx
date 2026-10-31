import { StainedGlassView, stainedGlassMetadata } from "@/views/StainedGlassView";

export const metadata = stainedGlassMetadata("en");

export default function Page() {
  return <StainedGlassView locale="en" />;
}
