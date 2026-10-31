import { PaletteView, paletteMetadata } from "@/views/PaletteView";

export const metadata = paletteMetadata("en");

export default function Page() {
  return <PaletteView locale="en" />;
}
