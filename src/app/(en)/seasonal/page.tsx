import { SeasonalView, seasonalMetadata } from "@/views/SeasonalViews";

export const metadata = seasonalMetadata("en");

export default function Page() {
  return <SeasonalView locale="en" />;
}
