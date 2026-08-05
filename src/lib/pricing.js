// Maling: 1 liter dækker ca. 10 m² med 1 strøg. Standard 2 strøg → 5 m²/liter.
export const PAINT_COVERAGE_M2_PER_LITER = 5;

export function paintLiters(m2) {
  return Math.max(0, Math.ceil(Number(m2) || 0 / PAINT_COVERAGE_M2_PER_LITER));
}

// Knytter hver maleservice til en forbrugsmaling med literpris.
export const PAINT_MATERIALS = {
  'Væg-/loftmaling': { materialName: 'Maling materiale (væg/loft)', pricePerLiter: 145 },
  Facademaling: { materialName: 'Maling materiale (facade)', pricePerLiter: 175 },
  'Maling af træværk/vinduer': { materialName: 'Maling materiale (træ/lak)', pricePerLiter: 195 },
  Grundmaling: { materialName: 'Maling materiale (grunder)', pricePerLiter: 95 },
};

export const SERVICES = [
  { name: 'Gravearbejde', unit: 'm³', price: 580 },
  { name: 'Kloakrør lægning', unit: 'm', price: 850 },
  { name: 'Asfaltering', unit: 'm²', price: 395 },
  { name: 'Betonfundament', unit: 'm²', price: 850 },
  { name: 'Kantsten opsætning', unit: 'm', price: 185 },
  { name: 'Nedbrydning af belægning', unit: 'm', price: 250 },
  { name: 'Nedrivning', unit: 'm²', price: 450 },
  { name: 'Transport (materiale)', unit: 'fs', price: 3500 },
  { name: 'Maskinleje (gravemaskine)', unit: 'dag', price: 4500 },
  { name: 'Håndarbejde', unit: 'time', price: 280 },
];

export const SERVICE_CATEGORIES = [
  {
    category: 'Gravearbejde',
    services: [
      { name: 'Gravearbejde', unit: 'm³', price: 580 },
      { name: 'Grøftegravning', unit: 'm', price: 320 },
      { name: 'Afgravning', unit: 'm³', price: 145 },
      { name: 'Nedrivning', unit: 'm²', price: 450 },
    ],
  },
  {
    category: 'Kloak',
    services: [
      { name: 'Kloakrør lægning Ø300', unit: 'm', price: 850 },
      { name: 'Kloakbrønd', unit: 'stk', price: 4500 },
      { name: 'Kloakrenovering', unit: 'm', price: 950 },
    ],
  },
  {
    category: 'Asfalt & Belægning',
    services: [
      { name: 'Asfaltering', unit: 'm²', price: 395 },
      { name: 'Kantsten opsætning', unit: 'm', price: 185 },
      { name: 'Nedbrydning af belægning', unit: 'm', price: 250 },
    ],
  },
  {
    category: 'Beton',
    services: [
      { name: 'Betonfundament', unit: 'm²', price: 850 },
      { name: 'Beton støbning', unit: 'm³', price: 1150 },
      { name: 'Armering', unit: 'm', price: 28 },
    ],
  },
  {
    category: 'Transport & Maskiner',
    services: [
      { name: 'Transport (materiale)', unit: 'fs', price: 3500 },
      { name: 'Maskinleje (gravemaskine)', unit: 'dag', price: 4500 },
      { name: 'Affaldsbortkørsel', unit: 'fs', price: 3500 },
      { name: 'Håndarbejde', unit: 'time', price: 280 },
    ],
  },
  {
    category: 'Maling',
    services: [
      { name: 'Væg-/loftmaling', unit: 'm²', price: 75, paint: 'Væg-/loftmaling' },
      { name: 'Facademaling', unit: 'm²', price: 95, paint: 'Facademaling' },
      { name: 'Maling af træværk/vinduer', unit: 'm²', price: 120, paint: 'Maling af træværk/vinduer' },
      { name: 'Grundmaling', unit: 'm²', price: 25, paint: 'Grundmaling' },
    ],
  },
  {
    category: 'Teknisk isolering',
    services: [
      { name: 'Rørisolering (mineraluld)', unit: 'm', price: 145 },
      { name: 'Beholderisolering', unit: 'm²', price: 295 },
      { name: 'Ventilationsisolering', unit: 'm', price: 185 },
      { name: 'Teknisk isolering (tag/væg)', unit: 'm²', price: 245 },
      { name: 'Brandisolering', unit: 'm²', price: 395 },
      { name: 'Armeringssokkel isolering', unit: 'm', price: 165 },
      { name: 'Indblæsning af isolering (150 mm)', unit: 'm²', price: 120 },
      { name: 'Indblæsning af isolering (200 mm)', unit: 'm²', price: 150 },
      { name: 'Indblæsning af isolering (250 mm)', unit: 'm²', price: 175 },
      { name: 'Indblæsning af isolering (300 mm)', unit: 'm²', price: 190 },
    ],
  },
];