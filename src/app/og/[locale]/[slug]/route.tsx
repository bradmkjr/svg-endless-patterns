import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { cardPicture } from "@/lib/cardPictures";
import { SITE_LOCALES } from "@/lib/i18n";
import { localeAccent } from "@/lib/localeAccent";
import { CARD_SIZE, cardFile } from "@/lib/pageMetadata";
import { SITE_NAME } from "@/lib/site";
import { sitePaths } from "@/lib/sitePaths";
import { socialCard, type CardPicture, type SocialCard } from "@/lib/socialCards";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

const INK = "#25221c";
const MUTED = "#6a6459";
const PAPER = "#faf6ee";
const NAVY = "#23395d";
const RUST = "#b5533c";
const SIDE = CARD_SIZE.height;

export async function generateStaticParams() {
  const paths = await sitePaths();
  return SITE_LOCALES.flatMap(({ code }) => paths.map((path) => ({ locale: code, slug: `${cardFile(path)}.png` })));
}

const fontFile = (name: string) => readFile(join(process.cwd(), "src/assets/fonts", name));
const fonts = Promise.all([fontFile("Fraunces-SemiBold.ttf"), fontFile("Geist-Medium.ttf")]);

/** A tile that always holds its place, so a card with no picture is still evenly laid out. */
function Tile({ src, size }: { src: string | null; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- drawn into a PNG, not a page
  return src ? <img src={src} alt="" width={size} height={size} /> : <div style={{ width: size, height: size, background: NAVY }} />;
}

/** The title's size: smaller for a long title, and small enough for its longest word to fit `width`. */
function titleSize(title: string, size: number, width: number): number {
  const longest = Math.max(...title.split(/\s+/).map((word) => word.length));
  const scaled = title.length > 42 ? size * 0.7 : title.length > 22 ? size * 0.82 : size;
  return Math.min(scaled, width / (longest * 0.6));
}

function Text({ card, accent, size, width }: { card: SocialCard; accent: string; size: number; width: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ width: 72, height: 8, background: accent, marginBottom: 28 }} />
      {card.kicker ? <div style={{ fontFamily: "Geist", fontSize: 26, color: NAVY, marginBottom: 14 }}>{card.kicker}</div> : null}
      <div style={{ fontFamily: "Fraunces", fontSize: titleSize(card.title, size, width), lineHeight: 1.08, color: INK }}>{card.title}</div>
      {card.subtitle ? <div style={{ display: "block", lineClamp: 3, fontFamily: "Geist", fontSize: 28, lineHeight: 1.32, color: MUTED, marginTop: 22 }}>{card.subtitle}</div> : null}
    </div>
  );
}

const Brand = () => <div style={{ fontFamily: "Fraunces", fontSize: 28, color: NAVY }}>{SITE_NAME}</div>;

/** Text on the left, with one pattern or a section's grid on the right. */
function SideArt({ card, accent, pictures }: { card: SocialCard; accent: string; pictures: (string | null)[] }) {
  const columns = pictures.length > 1 ? 3 : 1;
  const tile = SIDE / columns;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER }}>
      <div style={{ width: CARD_SIZE.width - SIDE, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 48px 44px 56px" }}>
        <Text card={card} accent={accent} size={68} width={CARD_SIZE.width - SIDE - 104} />
        <Brand />
      </div>
      <div style={{ width: SIDE, height: SIDE, display: "flex", flexWrap: "wrap", background: "#ffffff" }}>
        {pictures.map((src, i) => (
          <Tile key={i} src={src} size={tile} />
        ))}
      </div>
    </div>
  );
}

/** A panel of text over a background that fills the card. */
function Wall({ card, accent, children }: { card: SocialCard; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: NAVY }}>
      {children}
      <div style={{ position: "absolute", left: 180, top: 115, width: 840, height: 400, display: "flex", flexDirection: "column", justifyContent: "center", background: PAPER, padding: "0 60px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
        <Text card={card} accent={accent} size={84} width={720} />
      </div>
    </div>
  );
}

const WALL_COLUMNS = 6;
const WALL_ROWS = 3;

function Art({ card, accent, pictures }: { card: SocialCard; accent: string; pictures: (string | null)[] }) {
  if (card.art === "feature" || card.art === "grid") return <SideArt card={card} accent={accent} pictures={pictures} />;
  if (card.art === "palette") {
    return (
      <Wall card={card} accent={accent}>
        <div style={{ position: "absolute", left: 0, top: 0, width: CARD_SIZE.width, height: CARD_SIZE.height, display: "flex" }}>
          {card.colors.slice(0, 24).map((colors, i) => (
            <div key={i} style={{ width: CARD_SIZE.width / 24, height: CARD_SIZE.height, display: "flex", flexDirection: "column" }}>
              {colors.map((color, j) => (
                <div key={j} style={{ width: "100%", height: CARD_SIZE.height / colors.length, background: color }} />
              ))}
            </div>
          ))}
        </div>
      </Wall>
    );
  }
  // Square tiles, a little wider than the card, so its edges cut through a row evenly.
  const tile = CARD_SIZE.height / WALL_ROWS;
  const width = tile * WALL_COLUMNS;
  return (
    <Wall card={card} accent={accent}>
      <div style={{ position: "absolute", left: (CARD_SIZE.width - width) / 2, top: 0, width, height: CARD_SIZE.height, display: "flex", flexWrap: "wrap" }}>
        {pictures.slice(0, WALL_COLUMNS * WALL_ROWS).map((src, i) => (
          <Tile key={i} src={src} size={tile} />
        ))}
      </div>
    </Wall>
  );
}

export async function GET(_request: Request, { params }: Props) {
  const { locale: code, slug } = await params;
  const locale = SITE_LOCALES.find((l) => l.code === code)?.code;
  if (!locale) return new Response(null, { status: 404 });
  const paths = await sitePaths();
  const path = paths.find((p) => `${cardFile(p)}.png` === slug);
  const card = path && (await socialCard(locale, path));
  if (!card) return new Response(null, { status: 404 });
  const wanted: CardPicture[] = card.art === "palette" ? [] : card.pictures;
  const pictures = await Promise.all(wanted.map(cardPicture));
  const [fraunces, geist] = await fonts;
  return new ImageResponse(<Art card={card} accent={localeAccent(locale, RUST)} pictures={pictures} />, {
    ...CARD_SIZE,
    fonts: [
      { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
      { name: "Geist", data: geist, weight: 500, style: "normal" },
    ],
  });
}
