import { NeedlepointView, needlepointMetadata } from "@/views/NeedlepointView";

export const metadata = needlepointMetadata("en");

export default function Page() {
  return <NeedlepointView locale="en" />;
}
