import { OrigamiTessellationView, origamiTessellationMetadata } from "@/views/OrigamiTessellationView";

export const metadata = origamiTessellationMetadata("en");

export default function Page() {
  return <OrigamiTessellationView locale="en" />;
}
