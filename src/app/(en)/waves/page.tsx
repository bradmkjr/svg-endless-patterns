import { WavesView, wavesMetadata } from "@/views/WavesView";

export const metadata = wavesMetadata("en");

export default function Page() {
  return <WavesView locale="en" />;
}
