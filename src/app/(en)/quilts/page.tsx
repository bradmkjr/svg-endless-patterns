import { QuiltView, quiltMetadata } from "@/views/QuiltView";

export const metadata = quiltMetadata("en");

export default function Page() {
  return <QuiltView locale="en" />;
}
