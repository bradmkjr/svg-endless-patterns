import { SashikoView, sashikoMetadata } from "@/views/SashikoView";

export const metadata = sashikoMetadata("en");

export default function Page() {
  return <SashikoView locale="en" />;
}
