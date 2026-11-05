import { NatureView, natureMetadata } from "@/views/NatureView";

export const metadata = natureMetadata("en");

export default function Page() {
  return <NatureView locale="en" />;
}
