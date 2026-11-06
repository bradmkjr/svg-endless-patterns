import { ChineseLatticeView, chineseLatticeMetadata } from "@/views/ChineseLatticeView";

export const metadata = chineseLatticeMetadata("en");

export default function Page() {
  return <ChineseLatticeView locale="en" />;
}
