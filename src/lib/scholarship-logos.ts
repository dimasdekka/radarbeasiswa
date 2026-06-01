/** Country code mapping for flag images */
const COUNTRY_CODE_MAP: Record<string, string> = {
  "indonesia": "id",
  "inggris": "gb", "uk": "gb", "united kingdom": "gb",
  "jerman": "de", "germany": "de",
  "jepang": "jp", "japan": "jp",
  "korea": "kr", "korea selatan": "kr",
  "australia": "au",
  "usa": "us", "amerika": "us", "amerika serikat": "us",
  "singapura": "sg", "singapore": "sg",
  "hungaria": "hu", "hungary": "hu",
  "belgia": "be", "belgium": "be",
  "belanda": "nl", "netherlands": "nl",
  "turki": "tr", "türkiye": "tr", "turkey": "tr",
  "china": "cn", "tiongkok": "cn",
  "eropa": "eu", "europe": "eu",
  "eropa (multi-negara)": "eu",
};

/** Get small flag image (40px) for corner badge */
export function getCountryFlagSmall(negara: string): string {
  const code = COUNTRY_CODE_MAP[negara.toLowerCase()] ?? "un";
  return `https://flagcdn.com/w40/${code}.png`;
}

/** Generate gradient colors based on string hash for card background */
export function getGradientColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return [`hsl(${h1}, 45%, 50%)`, `hsl(${h2}, 40%, 40%)`];
}

/**
 * Tier-2 fallback image: the provider/campus logo, derived from the official
 * scholarship URL's domain via Google's favicon service (free, no API key).
 * Returns null if no usable domain can be parsed.
 */
export function getProviderLogo(urlResmi?: string | null): string | null {
  if (!urlResmi) return null;
  try {
    const host = new URL(urlResmi).hostname;
    if (!host) return null;
    // sz=256 gives a crisp logo that stays sharp when centered on the card,
    // avoiding the grainy look of the tiny 128px / favicon variants.
    return `https://www.google.com/s2/favicons?domain=${host}&sz=256`;
  } catch {
    return null;
  }
}
