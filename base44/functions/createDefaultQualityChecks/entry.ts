import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const STANDARD_CHECKLISTS = [
  {
    title: 'Færdigmelding',
    type: 'Færdigmelding',
    items: [
      { description: 'Arbejdet udført i overensstemmelse med tilbud', checked: false, notes: '' },
      { description: 'Materialer leveret og monteret korrekt', checked: false, notes: '' },
      { description: 'Oprydning af byggeplads foretaget', checked: false, notes: '' },
      { description: 'Affald sorteret og fjernet', checked: false, notes: '' },
      { description: 'Overflader rengjort', checked: false, notes: '' },
      { description: 'Installationer testet og virker', checked: false, notes: '' },
      { description: 'Billeder taget før og efter', checked: false, notes: '' },
    ],
  },
  {
    title: 'AR-bevis og dokumentation',
    type: 'AR-bevis',
    items: [
      { description: 'Arbejdsplans sikkerhedsplan gennemgået', checked: false, notes: '' },
      { description: 'Sikkerhedsuddeling foretaget', checked: false, notes: '' },
      { description: 'Brugs- og sikkerhedsvejledninger udleveret', checked: false, notes: '' },
      { description: 'Tegninger indsamlet og arkiveret', checked: false, notes: '' },
      { description: 'Materialeattester indsamlet', checked: false, notes: '' },
      { description: 'Dagbøger og tidsregistreringer opdateret', checked: false, notes: '' },
    ],
  },
  {
    title: 'Sikkerhedsinspektion',
    type: 'Sikkerhedsinspektion',
    items: [
      { description: 'Sikkerhedsafskærmning opsat', checked: false, notes: '' },
      { description: 'Advarselsskilte placeret synligt', checked: false, notes: '' },
      { description: 'Faldsikring etableret hvor nødvendigt', checked: false, notes: '' },
      { description: 'Elsikkerhed kontrolleret', checked: false, notes: '' },
      { description: 'Brandfarlige materialer opbevaret korrekt', checked: false, notes: '' },
      { description: 'Værneudstyr stillet til rådighed', checked: false, notes: '' },
    ],
  },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { project_id } = body;

    if (!project_id) return Response.json({ error: 'Manglende projekt ID' }, { status: 400 });

    let project;
    try {
      project = await base44.asServiceRole.entities.Project.get(project_id);
    } catch {
      return Response.json({ error: 'Projekt ikke fundet' }, { status: 404 });
    }

    const created = [];
    for (const checklist of STANDARD_CHECKLISTS) {
      const record = await base44.asServiceRole.entities.QualityCheck.create({
        project_id: project.id,
        project_name: project.name,
        customer_email: project.customer_email || '',
        title: checklist.title,
        type: checklist.type,
        status: 'Ikke startet',
        items: checklist.items,
        checked_by: '',
        check_date: '',
        notes: '',
      });
      created.push(record.id);
    }

    return Response.json({
      success: true,
      project_id: project.id,
      created_checks: created.length,
      checklists: STANDARD_CHECKLISTS.map((c) => c.title),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}