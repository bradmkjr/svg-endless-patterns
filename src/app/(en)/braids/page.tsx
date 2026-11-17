import { BraidView, braidMetadata } from "@/views/BraidView";

export const metadata = braidMetadata("en");

export default function Page() {
  return <BraidView locale="en" />;
}
