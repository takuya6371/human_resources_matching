// Country → flag emoji + African region. Focused on African countries;
// non-listed countries return null (no flag shown).

const COUNTRY_INFO = {
  "south africa": { flag: "🇿🇦", region: "Southern Africa" },
  "nigeria": { flag: "🇳🇬", region: "West Africa" },
  "kenya": { flag: "🇰🇪", region: "East Africa" },
  "ghana": { flag: "🇬🇭", region: "West Africa" },
  "egypt": { flag: "🇪🇬", region: "North Africa" },
  "morocco": { flag: "🇲🇦", region: "North Africa" },
  "ethiopia": { flag: "🇪🇹", region: "East Africa" },
  "tanzania": { flag: "🇹🇿", region: "East Africa" },
  "uganda": { flag: "🇺🇬", region: "East Africa" },
  "algeria": { flag: "🇩🇿", region: "North Africa" },
  "sudan": { flag: "🇸🇩", region: "North-East Africa" },
  "tunisia": { flag: "🇹🇳", region: "North Africa" },
  "senegal": { flag: "🇸🇳", region: "West Africa" },
  "cameroon": { flag: "🇨🇲", region: "Central Africa" },
  "zambia": { flag: "🇿🇲", region: "Southern Africa" },
  "zimbabwe": { flag: "🇿🇼", region: "Southern Africa" },
  "rwanda": { flag: "🇷🇼", region: "East Africa" },
  "botswana": { flag: "🇧🇼", region: "Southern Africa" },
  "namibia": { flag: "🇳🇦", region: "Southern Africa" },
  "mozambique": { flag: "🇲🇿", region: "Southern Africa" },
  "angola": { flag: "🇦🇴", region: "Southern Africa" },
  "dr congo": { flag: "🇨🇩", region: "Central Africa" },
  "congo": { flag: "🇨🇬", region: "Central Africa" },
  "ivory coast": { flag: "🇨🇮", region: "West Africa" },
  "côte d'ivoire": { flag: "🇨🇮", region: "West Africa" },
  "mali": { flag: "🇲🇱", region: "West Africa" },
  "madagascar": { flag: "🇲🇬", region: "East Africa" },
  "malawi": { flag: "🇲🇼", region: "East Africa" },
  "liberia": { flag: "🇱🇱", region: "West Africa" },
  "sierra leone": { flag: "🇸🇱", region: "West Africa" },
  "togo": { flag: "🇹🇬", region: "West Africa" },
  "benin": { flag: "🇧🇯", region: "West Africa" },
  "burkina faso": { flag: "🇧🇫", region: "West Africa" },
  "niger": { flag: "🇳🇪", region: "West Africa" },
  "chad": { flag: "🇹🇩", region: "Central Africa" },
  "mauritania": { flag: "🇲🇷", region: "West Africa" },
  "burundi": { flag: "🇧🇮", region: "East Africa" },
  "djibouti": { flag: "🇩🇯", region: "East Africa" },
  "eritrea": { flag: "🇪🇷", region: "East Africa" },
  "somalia": { flag: "🇸🇴", region: "East Africa" },
  "south sudan": { flag: "🇸🇸", region: "East Africa" },
  "lesotho": { flag: "🇱🇸", region: "Southern Africa" },
  "eswatini": { flag: "🇸🇿", region: "Southern Africa" },
  "mauritius": { flag: "🇲🇺", region: "East Africa" },
  "seychelles": { flag: "🇸🇨", region: "East Africa" },
  "gabon": { flag: "🇬🇦", region: "Central Africa" },
  "equatorial guinea": { flag: "🇬🇶", region: "Central Africa" },
  "guinea": { flag: "🇬🇳", region: "West Africa" },
  "guinea-bissau": { flag: "🇬🇼", region: "West Africa" },
  "comoros": { flag: "🇰🇲", region: "East Africa" },
  "cape verde": { flag: "🇨🇻", region: "West Africa" },
  "cabo verde": { flag: "🇨🇻", region: "West Africa" },
  "central african republic": { flag: "🇨🇫", region: "Central Africa" },
  "sao tome and principe": { flag: "🇸🇹", region: "Central Africa" },
  "gambia": { flag: "🇬🇲", region: "West Africa" },
  "japan": { flag: "🇯🇵", region: "East Asia" },
};

export const COUNTRY_NAMES = [
  "Nigeria", "Kenya", "Ghana", "Senegal", "Ethiopia", "Rwanda", "Tanzania", "Uganda",
  "Cameroon", "Burundi", "Mali", "Ivory Coast", "Zambia", "Zimbabwe", "South Africa",
  "Mozambique", "Egypt", "Morocco", "Tunisia", "Algeria", "Sudan", "DR Congo", "Congo",
  "Madagascar", "Malawi", "Liberia", "Sierra Leone", "Togo", "Benin", "Burkina Faso",
  "Niger", "Chad", "Mauritania", "Djibouti", "Eritrea", "Somalia", "South Sudan",
  "Lesotho", "Eswatini", "Mauritius", "Seychelles", "Gabon", "Equatorial Guinea",
  "Guinea", "Guinea-Bissau", "Comoros", "Cape Verde", "Central African Republic",
  "Sao Tome and Principe", "Gambia", "Botswana", "Namibia", "Angola", "Japan",
];

export const INDUSTRY_LIST = [
  "Software Engineering", "Data Science", "Product Design", "DevOps", "Mobile Development",
  "AI / ML", "Cybersecurity", "Fintech", "Digital Marketing", "Cloud Engineering",
  "UI/UX", "QA Engineering", "Blockchain", "Robotics", "Game Development",
  "E-commerce", "Digital Health", "Education", "Consulting", "Operations",
];

export function getCountryInfo(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return COUNTRY_INFO[key] || null;
}

// Returns a real flag image URL (flagcdn SVG) for a country, or null.
// Flag emojis render as two-letter codes on Windows, so we use images instead.
export function getCountryFlagUrl(name) {
  const info = getCountryInfo(name);
  if (!info || !info.flag) return null;
  const code = Array.from(info.flag)
    .map((ch) => {
      const c = ch.codePointAt(0);
      return c >= 0x1f1e6 && c <= 0x1f1ff ? String.fromCharCode(0x41 + (c - 0x1f1e6)) : "";
    })
    .join("");
  return code ? `https://flagcdn.com/${code.toLowerCase()}.svg` : null;
}