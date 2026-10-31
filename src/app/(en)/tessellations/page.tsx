import { TessellationView, tessellationMetadata } from "@/views/TessellationView";

export const metadata = tessellationMetadata("en");

export default function Page() {
  return <TessellationView locale="en" />;
}
