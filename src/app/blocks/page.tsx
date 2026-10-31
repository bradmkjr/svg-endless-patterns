import type { Metadata } from "next";
import { BlockGrid } from "@/components/BlockGrid";
import { getBlocks } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Traditional Quilt Blocks to Customize",
  description: "Choose a traditional quilt block, then set its size and colors to get a cutting list, yardage, seamless repeats and printable templates.",
  alternates: { canonical: absoluteUrl("/blocks/") },
};

export default async function BlocksPage() {
  const blocks = await getBlocks();
  const families = [...new Set(blocks.map((b) => b.family))];
  return (
    <div className="page">
      <h1>Quilt blocks</h1>
      <p className="lede">Each of these {blocks.length} blocks can be made in any size from 3&quot; to 24&quot;, in your own colors.</p>
      {families.map((family) => (
        <section key={family}>
          <h2>{family}</h2>
          <BlockGrid blocks={blocks.filter((b) => b.family === family)} />
        </section>
      ))}
    </div>
  );
}
