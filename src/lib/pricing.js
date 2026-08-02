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
];