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
  { id: "truchet", author: "Sébastien Truchet", title: "Mémoire sur les combinaisons", detail: "Mémoires de l'Académie Royale des Sciences, 1704" },
  { id: "girih", author: "Peter J. Lu and Paul J. Steinhardt", title: "Decagonal and Quasi-Crystalline Tilings in Medieval Islamic Architecture", detail: "Science 315, 2007" },
];

export const referencesFor = (ids: ReferenceId[]) => REFERENCES.filter((reference) => ids.includes(reference.id));
export const referenceText = (locale: Locale) => text[locale];
