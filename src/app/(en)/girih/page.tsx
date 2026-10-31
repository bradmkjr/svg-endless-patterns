import { GirihView, girihMetadata } from "@/views/GirihView";

export const metadata = girihMetadata("en");

export default function Page() {
  return <GirihView locale="en" />;
}
