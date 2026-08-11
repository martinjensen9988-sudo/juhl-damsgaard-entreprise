export const fynCities = [
  'Odense',
  'Svendborg',
  'Nyborg',
  'Middelfart',
  'Faaborg',
  'Assens',
  'Bogense',
  'Kerteminde',
  'Ringe',
  'Otterup',
];

export const jyllandCities = [
  'Aarhus',
  'Aalborg',
  'Esbjerg',
  'Randers',
  'Kolding',
  'Horsens',
  'Vejle',
  'Herning',
  'Silkeborg',
  'Fredericia',
  'Viborg',
  'Holstebro',
  'Skive',
  'Haderslev',
  'Aabenraa',
  'Sønderborg',
  'Billund',
  'Vejen',
  'Ikast',
  'Brande',
  'Skanderborg',
  'Hedensted',
  'Varde',
  'Ringkøbing',
  'Hobro',
];

export const serviceAreas = ['Fyn', 'Jylland', ...fynCities, ...jyllandCities];

export const fynCityText = fynCities.join(', ');
export const jyllandCityText = jyllandCities.join(', ');
export const localAreaText = `${fynCityText} samt ${jyllandCityText}`;
