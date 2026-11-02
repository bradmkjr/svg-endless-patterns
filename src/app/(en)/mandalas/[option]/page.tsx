import { MandalaView, mandalaOptionMetadata, mandalaStaticParams } from "@/views/MandalaView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return mandalaStaticParams();
}

export async function generateMetadata({ params }: Props) {
  return mandalaOptionMetadata("en", (await params).option);
}

export default async function Page({ params }: Props) {
  return <MandalaView locale="en" option={(await params).option} />;
}
