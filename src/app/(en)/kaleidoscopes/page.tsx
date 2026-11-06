import { KaleidoscopeView, kaleidoscopeMetadata } from "@/views/KaleidoscopeView";

export const metadata = kaleidoscopeMetadata("en");

export default function Page() {
  return <KaleidoscopeView locale="en" />;
}
