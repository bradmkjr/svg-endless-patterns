import { it } from "vitest";
import { buildPieces, cuttingFaults, LAYOUT_IDS, fitPanel } from "./stainedGlass";
it("survey", () => {
  const sides = Array.from({ length: 15 }, (_, i) => 8 + i * 2);
  for (const layout of LAYOUT_IDS) for (const detail of [1,2,3]) {
    const faults: Record<string, number> = {}; let bad=0,total=0; const ex:string[]=[]; let maxN=0;
    for (const w of sides) for (const h of sides) { const f=fitPanel(w,h); if(f.changed) continue;
      for (const [cameWidth,heartWidth] of [[0.25,0.0625],[0.5,0.09375]]) { total++;
      const ps=buildPieces({layout,width:w,height:h,cameWidth,heartWidth},detail); maxN=Math.max(maxN,ps.length);
      let any=false; for(const p of ps){for(const x of cuttingFaults(p.line,p.cut,p.sight)){faults[x]=(faults[x]??0)+1;any=true;}}
      if(any){bad++; if(ex.length<6) ex.push(`${w}x${h}/${cameWidth}`);}
    }}
    console.log(layout,detail,`bad ${bad}/${total}`,"max pieces",maxN,JSON.stringify(faults),ex.join(" "));
  }
});
