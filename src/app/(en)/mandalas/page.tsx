import { MandalaView, mandalaMetadata } from "@/views/MandalaView";

export const metadata = mandalaMetadata("en");

export default function Page() {
  return <MandalaView locale="en" />;
}
