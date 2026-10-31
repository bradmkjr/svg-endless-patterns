import type { Locale } from "./generator";
import text from "@/i18n/messages/acknowledgements.json";

/** Outside work the site draws on. Anything that uses a source lists it here and links to it. */

export type ReferenceId = keyof typeof text.en.usedFor;
export type Reference = { id: ReferenceId; author: string; title: string; detail?: string; url?: string };

export const REFERENCES: Reference[] = [
  { id: "dharmaTieDye", author: "Dharma Trading Co.", title: "Tie Dye Instructions", url: "https://www.dharmatrading.com/blogs/t/tie-dye-instructions" },
  { id: "prim", author: "R. C. Prim", title: "Shortest Connection Networks and Some Generalizations", detail: "Bell System Technical Journal 36, 1957" },
  { id: "kruskal", author: "Joseph B. Kruskal", title: "On the Shortest Spanning Subtree of a Graph and the Traveling Salesman Problem", detail: "Proceedings of the American Mathematical Society 7, 1956" },
  { id: "wilson", author: "David Bruce Wilson", title: "Generating Random Spanning Trees More Quickly than the Cover Time", detail: "Proceedings of the 28th ACM Symposium on Theory of Computing, 1996" },
  { id: "mandelbrot", author: "Benoit B. Mandelbrot", title: "The Fractal Geometry of Nature", detail: "W. H. Freeman, 1982" },
  { id: "koch", author: "Helge von Koch", title: "Sur une courbe continue sans tangente, obtenue par une construction géométrique élémentaire", detail: "Arkiv för Matematik 1, 1904" },
  { id: "sierpinski", author: "Wacław Sierpiński", title: "Sur une courbe dont tout point est un point de ramification", detail: "Comptes Rendus de l'Académie des Sciences 160, 1915" },
  { id: "hilbert", author: "David Hilbert", title: "Über die stetige Abbildung einer Linie auf ein Flächenstück", detail: "Mathematische Annalen 38, 1891" },
  { id: "levy", author: "Paul Lévy", title: "Les courbes planes ou gauches et les surfaces composées de parties semblables au tout", detail: "Journal de l'École Polytechnique, 1938" },
  { id: "walkerMosaic", author: "Barbara G. Walker", title: "Mosaic Knitting", detail: "Charles Scribner's Sons, 1976" },
  { id: "truchet", author: "Sébastien Truchet", title: "Mémoire sur les combinaisons", detail: "Mémoires de l'Académie Royale des Sciences, 1704" },
  { id: "girih", author: "Peter J. Lu and Paul J. Steinhardt", title: "Decagonal and Quasi-Crystalline Tilings in Medieval Islamic Architecture", detail: "Science 315, 2007" },
];

export const referencesFor = (ids: ReferenceId[]) => REFERENCES.filter((reference) => ids.includes(reference.id));
export const referenceText = (locale: Locale) => text[locale];
