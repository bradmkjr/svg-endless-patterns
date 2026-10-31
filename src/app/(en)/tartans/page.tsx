import { TartanView, tartanMetadata } from "@/views/TartanView";

export const metadata = tartanMetadata("en");

export default function Page() {
  return <TartanView locale="en" />;
}
