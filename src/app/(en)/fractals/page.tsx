import { FractalView, fractalMetadata } from "@/views/FractalView";

export const metadata = fractalMetadata("en");

export default function Page() {
  return <FractalView locale="en" />;
}
