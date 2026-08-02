import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PRICING_CONTEXT = `Du er en prisberegner for Juhl & Damsgaard Entreprise, en fynsk entreprenørvirksomhed.
Kunden beskriver et projekt, og du skal udregne et vejledende tilbud med materialer og arbejde.

Vores priser (ekskl. moms):
- Gravearbejde: 580 kr/m³
- Grøftegravning: 320 kr/m
- Afgravning: 145 kr/m³
- Nedrivning: 450 kr/m²
- Kloakrør lægning Ø300: 850 kr/m
- Kloakbrønd: 4500 kr/stk
- Kloakrenovering: 950 kr/m
- Asfaltering: 395 kr/m²
- Kantsten opsætning: 185 kr/m
- Nedbrydning af belægning: 250 kr/m
- Betonfundament: 850 kr/m²
- Beton støbning: 1150 kr/m³
- Armering: 28 kr/m
- Transport (materiale): 3500 kr/fs
- Maskinleje (gravemaskine): 4500 kr/dag
- Affaldsbortkørsel: 3500 kr/fs
- Håndarbejde: 280 kr/time (350 kr/time inkl. moms)

Moms: 25% på alt. Alle priser ovenfor er ekskl. moms.

Regler:
- Estimer mængder ud fra kundens beskrivelse. Vær rimelig og realistisk.
- Inkluder alt hvad opgaven kræver: både materialer, maskiner, transport og arbejdstid.
- Hvis kunden ikke giver nok info, så estimer rimeligt og forklar dine antagelser kort.
- Subtotal = sum af alle linjer (ekskl. moms). Moms = subtotal × 0.25. Total = subtotal + moms.
- Svaret skal være på dansk, professionelt og venligt.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Besked mangler' }, { status: 400 });
    }
    if (message.length > 2000) {
      return Response.json({ error: 'Beskeden er for lang (max 2000 tegn)' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${PRICING_CONTEXT}\n\nKunden skriver:\n"${message}"\n\nLav et vejledende tilbud. Inkluder de relevante linjer med estimerede mængder og priser. Beregn subtotal (ekskl. moms), moms (25%) og total (inkl. moms).`,
      response_json_schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Professionelt, venligt svar på dansk der forklarer tilbuddet og eventuelle antagelser' },
          line_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'Beskrivelse af ydelsen' },
                quantity: { type: 'number', description: 'Estimeret mængde' },
                unit: { type: 'string', description: 'Enhed, f.eks. m², m³, time, stk' },
                unit_price: { type: 'number', description: 'Stk. pris ekskl. moms' },
                line_total: { type: 'number', description: 'Linje total ekskl. moms (quantity × unit_price)' }
              }
            }
          },
          subtotal: { type: 'number', description: 'Subtotal ekskl. moms' },
          vat: { type: 'number', description: 'Moms 25%' },
          total: { type: 'number', description: 'Total inkl. moms' }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}