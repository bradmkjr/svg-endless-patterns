import { TieDyeView, tieDyeMetadata } from "@/views/TieDyeView";

export const metadata = tieDyeMetadata("en");

export default function Page() {
  return <TieDyeView locale="en" />;
}
