import {
  HardHat, Droplets, Layers, Building2, Hammer, Trees,
  ShieldCheck, Clock, Award,
  Phone, FileText, ClipboardCheck, CheckCircle2,
  Siren, KeyRound, Snowflake, Recycle, Boxes, Pickaxe, Construction,
  Route, Waves, Trash2, Leaf, Snowflake as Snow, Wrench, Flame,
  ParkingCircle, Fence, Lightbulb, Shovel, Mountain, Truck, HousePlus, Banknote, FileWarning,
  Zap, Ruler, Thermometer, Plug, PaintRoller, DoorClosed,
} from 'lucide-react';

export const services = [
  {
    icon: HardHat, title: 'Gravearbejde', slug: 'gravearbejde',
    desc: 'Professionelt gravearbejde til alle formål — fra fundamenter til ledningsgraving.',
    longDesc: 'Vi udfører alt gravearbejde — fra den simple spadetagning til store jordflytninger og terrænregulering. Vores erfarne gravemaskineoperatører sikrer præcist arbejde, uanset om det gælder fundamenter, ledningsgraving eller etablering af byggeplads. Vi arbejder både for private, foreninger og erhverv, og vi sørger for at jord og fyld fjernes eller placeres korrekt.',
    highlights: ['Fundamenter & sokler', 'Ledningsgraving (vand, el, fjernvarme, data)', 'Terrænregulering & udjævning', 'Jordforflytning & skærver', 'Spadetagning & gravearbejde til alle formål'],
  },
  {
    icon: Droplets, title: 'Kloak & Dræn', slug: 'kloak-draen',
    desc: 'Kloaklægning, omtilslutninger og drænløsninger udført efter gældende normer.',
    longDesc: 'Vi lægger ny kloak, udskifter eksisterende ledninger og etablerer drænløsninger omkring bygninger og på arealer mod fugt. Alt arbejde udføres efter gældende normer og i tæt dialog med kommunen om tilslutninger. Vi håndterer også separatkloakering og regnvandshåndtering med bassiner og faskiner.',
    highlights: ['Ny kloak & udskiftning', 'Drænløsninger mod fugt', 'Omtilslutning til offentlig kloak', 'Separatkloakering', 'Regnvandsbassiner & faskiner'],
  },
  {
    icon: Layers, title: 'Asfalt & Brolægning', slug: 'asfalt-brolaegning',
    desc: 'Asfaltlægning, brolægning og flisearbejde med holdbart resultat.',
    longDesc: 'Vi lægger asfalt til kørearealer, stier og pladser med et holdbart og ensartet resultat. Derudover udfører vi brolægning af indkørsler, torve og arealer samt flise- og klinkelægning til udearealer. Vi tilbyder også overfladebehandling som slurry og microasfalt til vedligeholdelse af eksisterende asfalt.',
    highlights: ['Asfaltlægning til kørearealer', 'Brolægning af indkørsler & torve', 'Flise- og klinkelægning', 'Overfladebehandling (slurry, microasfalt)', 'Vedligeholdelse af eksisterende asfalt'],
  },
  {
    icon: Building2, title: 'Beton & Støbning', slug: 'beton-stobning',
    desc: 'Betonarbejde, fundamenter og støbning til både små og store projekter.',
    longDesc: 'Vi udfører betonarbejde i alle skalaer — fra fundamenter til bygninger, maskiner og hegn til støbning af gulve, sokler og plader. Vi støber også trapper og specialdetaljer, og leverer større industribeton til erhverv og industri. Kvaliteten sikres gennem korrekt armering, udstøbning og efterbehandling.',
    highlights: ['Betonfundamenter til bygninger & maskiner', 'Støbning af gulve, sokler & plader', 'Sokler, trapper & detaljer', 'Industribeton til erhverv', 'Korrekt armering & efterbehandling'],
  },
  {
    icon: Hammer, title: 'Nedrivning', slug: 'nedrivning',
    desc: 'Sikker og effektiv nedrivning af bygninger og installationer.',
    longDesc: 'Vi udfører sikker og effektiv nedrivning af bygninger, installationer og arealer. Arbejdet planlægges nøje med henblik på sikkerhed og mulighed for genbrug. Vi sorterer byggeaffald korrekt og sørger for containerløsninger til jord, beton og affald, så pladsen efterlades ryddet og klar til nyt brug.',
    highlights: ['Nedrivning af bygninger & installationer', 'Kontrolleret demontering med genbrug', 'Affaldssortering efter reglerne', 'Containerløsninger til jord & beton', 'Byggeplads ryddet og klar'],
  },
  {
    icon: Trees, title: 'Anlæg & Udearealer', slug: 'anlaeg-udearealer',
    desc: 'Anlægsarbejde, haveanlæg og udearealer skræddersyet til din ejendom.',
    longDesc: 'Vi anlægger haver, græsarealer og beplantning skræddersyet til din ejendom. Det gælder både træer, buske og bede samt heg, støttemure og opkantning af arealer. Vi etablerer også udebelægning og belysning, så det samlede udeareal fremstår helstøbt og indbydende.',
    highlights: ['Haveanlæg & græsarealer', 'Beplantning — træer, buske & bede', 'Hegn & støttemure', 'Opkantning af arealer', 'Udebelægning & belysning'],
  },
  {
    icon: Siren, title: 'Skadeservice', slug: 'skadeservice',
    desc: 'Hurtig hjælp ved vandskade, stormskade og akutte skader — vi rykker ud når det gælder.',
    longDesc: 'Ved akutte skader rykker vi typisk ud samme dag. Vi har erfaring med vandskade, stormskade og frostskade, og vi arbejder tæt sammen med forsikringsselskaber om skadesrapportering og udbudring. Undervejs sikrer vi fuld billedokumentation, så du har det nødvendige grundlag for forsikringssagen.',
    highlights: ['Akut hjælp — samme dag', 'Vandskade, stormskade & frostskade', 'Skadesrapportering til forsikring', 'Fuld billedokumentation', 'Samarbejde med forsikringsselskab'],
  },
  {
    icon: KeyRound, title: 'Vicevært service', slug: 'vicevaert-service',
    desc: 'Løbende vedligeholdelse, tilsyn og småreparationer for foreninger og virksomheder.',
    longDesc: 'Vi tilbyder løbende viceværtsservice med tilsyn og vedligehold for foreninger og virksomheder. Det omfatter faste serviceaftaler, småreparationer og istandsættelse ved behov, så ejendommen holdes i god stand året rundt. Vi tilpasser omfanget til jeres behov og budget.',
    highlights: ['Løbende tilsyn & vedligehold', 'Faste serviceaftaler', 'Småreparationer & istandsættelse', 'Tilpasset foreninger & virksomheder', 'Ejendommen holdes i god stand'],
  },
  {
    icon: Snowflake, title: 'Snerydding', slug: 'snerydding',
    desc: 'Vintervedligeholdelse med snerydding, grusning og holdbare arealer om vinteren.',
    longDesc: 'Vi varetager vintervedligeholdelse med snerydding, grusning og saltning, så arealerne forbliver sikre og fremkommelige hele vinteren. Vi tilbyder faste vinteraftaler til foreninger og virksomheder, så I ved, hvem der rykker ud — og hvornår. Arealerne holdes fri for is og sne, uanset vejret.',
    highlights: ['Snerydding af arealer', 'Grusning & saltning', 'Faste vinteraftaler', 'Sikre & fremkommelige arealer', 'Tilpasset foreninger & virksomheder'],
  },
  {
    icon: Ruler, title: 'Tømrerarbejde', slug: 'toemrerarbejde',
    desc: 'Tømrerarbejde, tagværk, udvidelser og bygningssnedkeri — fra enkeltopgaver til fuld opførelse.',
    longDesc: 'Vi udfører alt tømrerarbejde — fra tagværk og træbeklædning til udvidelser, tilbygninger og fuld opførelse af carport, redskabsrum og udhus. Vores tømrere leverer kvalitetshåndværk til både private og erhverv, og vi sørger for at alt mål- og samlinger sidder perfekt. Vi tager også reparationer og vedligeholdelse af eksisterende træværk.',
    highlights: ['Tagværk & træbeklædning', 'Tilbygninger & udvidelser', 'Carport, redskabsrum & udhus', 'Reparation & vedligeholdelse af træværk', 'Mål- og samlinger i topklasse'],
  },
  {
    icon: Wrench, title: 'VVS & Installationer', slug: 'vvs-installationer',
    desc: 'VVS-arbejde — vand, varme og sanitet til både private og erhverv.',
    longDesc: 'Vi leverer komplet VVS-arbejde — installation af vand, varme og sanitet, udskiftning af rør og fittings, montering af VVS-udstyr og service på eksisterende installationer. Vi håndterer både nye installationer og reparationer, og sikrer at alt arbejde overholder gældende normer. Vi arbejder tæt sammen med autoriserede VVS-fagfolk ved installationer, der kræver certificering.',
    highlights: ['Vand, varme & sanitet', 'Installation af VVS-udstyr', 'Rørudskiftning & reparation', 'Nye installationer & service', 'Efter gældende normer'],
  },
  {
    icon: Zap, title: 'Elektriker', slug: 'elektriker',
    desc: 'El-installation, tilslutninger og service — trygt og certificeret.',
    longDesc: 'Vi leverer el-installation til både private og erhverv — fra nye installationer og tilslutninger til service og fejlfinding på eksisterende anlæg. Vi monterer belysning, stikkontakter, tavler og data, og sikrer at alt arbejde udføres certificeret og efter gældende regler. Vi arbejder med autoriserede elektrikere på opgaver, der kræver dokumentation.',
    highlights: ['Nye el-installationer', 'Tilslutninger & tavler', 'Belysning & stikkontakter', 'Fejlfinding & service', 'Certificeret & efter reglerne'],
  },
  {
    icon: HousePlus, title: 'Totalentreprise', slug: 'totalentreprise',
    desc: 'Samlet levering fra grav til færdigt byggeri — vi tager det hele.',
    longDesc: 'Vi tilbyder totalentrepriser, hvor vi håndterer hele byggeprocessen fra grav og fundament til færdigt byggeri — inklusive tømrer, VVS, elektriker og alt andet. Du får én samlet samarbejdspartner og ét kontaktpunkt, og vi koordinerer alle fag undervejs. Perfekt når du vil have det hele samlet ét sted uden at skulle samle underleverandører selv.',
    highlights: ['Fra grav til færdigt byggeri', 'Tømrer, VVS, elektriker & alt andet', 'Én samlet samarbejdspartner', 'Ét kontaktpunkt — vi koordinerer alt', 'Samlet levering uden underleverandører'],
  },
];

// Det fulde overblik — ALT vi laver, grupperet i kategorier
export const allServices = [
  {
    icon: Pickaxe,
    title: 'Gravearbejde & Jord',
    items: [
      { icon: Shovel, name: 'Gravearbejde', desc: 'Alt gravearbejde fra spadetagning til store jordflytninger.', slug: 'gravearbejde' },
      { icon: Mountain, name: 'Jordforflytning', desc: 'Transport og placering af jord, fyld og skærver.', slug: 'gravearbejde' },
      { icon: HardHat, name: 'Fundamenter', desc: 'Grave- og fundamentarbejde til bygninger og anlæg.', slug: 'gravearbejde' },
      { icon: Pickaxe, name: 'Ledningsgraving', desc: 'Gravning og etablering af vand, el, fjernvarme og data.', slug: 'gravearbejde' },
      { icon: Truck, name: 'Terrænregulering', desc: 'Udjævning og tilpasning af terræn til byggeplads eller have.', slug: 'gravearbejde' },
    ],
  },
  {
    icon: Droplets,
    title: 'Kloak, Vand & Dræn',
    items: [
      { icon: Droplets, name: 'Kloaklægning', desc: 'Ny kloak og udskiftning af eksisterende ledninger.', slug: 'kloak-draen' },
      { icon: Waves, name: 'Drænløsninger', desc: 'Dræn omkring bygninger og på arealer mod fugt.', slug: 'kloak-draen' },
      { icon: Droplets, name: 'Omtilslutninger', desc: 'Tilslutning til offentlig kloak ogSeparatkloakering.', slug: 'kloak-draen' },
      { icon: Droplets, name: 'Regnvandshåndtering', desc: 'Regnvandsbassiner, faskiner og afledning af overfladevand.', slug: 'kloak-draen' },
    ],
  },
  {
    icon: Layers,
    title: 'Asfalt & Brolægning',
    items: [
      { icon: Layers, name: 'Asfaltlægning', desc: 'Kørearealer, stier og pladser med holdbar asfalt.', slug: 'asfalt-brolaegning' },
      { icon: ParkingCircle, name: 'Brolægning', desc: 'Brolagte arealer, indkørsler og torve.', slug: 'asfalt-brolaegning' },
      { icon: Layers, name: 'Flisearbejde', desc: 'Flise- og klinkelægning til udearealer.', slug: 'asfalt-brolaegning' },
      { icon: Route, name: 'Overfladebehandling', desc: 'Slurry, microasfalt og vedligeholdelse af eksisterende asfalt.', slug: 'asfalt-brolaegning' },
    ],
  },
  {
    icon: Building2,
    title: 'Beton & Støbning',
    items: [
      { icon: Building2, name: 'Betonfundamenter', desc: 'Fundamenter til bygninger, maskiner og hegn.', slug: 'beton-stobning' },
      { icon: Building2, name: 'Støbning', desc: 'Støbning af gulve, sokler og plader.', slug: 'beton-stobning' },
      { icon: Building2, name: 'Sokler & Trapper', desc: 'Betonstøbte sokler, trapper og detaljer.', slug: 'beton-stobning' },
      { icon: Building2, name: 'Industribeton', desc: 'Større betonarbejde til industri og erhverv.', slug: 'beton-stobning' },
    ],
  },
  {
    icon: Hammer,
    title: 'Nedrivning & Demontering',
    items: [
      { icon: Hammer, name: 'Nedrivning', desc: 'Sikker nedrivning af bygninger og installationer.', slug: 'nedrivning' },
      { icon: Construction, name: 'Demontering', desc: 'Kontrolleret demontering med mulighed for genbrug.', slug: 'nedrivning' },
      { icon: Trash2, name: 'Affaldssortering', desc: 'Sortering og bortskaffelse efter gældende regler.', slug: 'nedrivning' },
      { icon: Boxes, name: 'Containerløsninger', desc: 'Containere til jord, beton og byggeaffald.', slug: 'nedrivning' },
    ],
  },
  {
    icon: Trees,
    title: 'Anlæg & Udearealer',
    items: [
      { icon: Trees, name: 'Haveanlæg', desc: 'Anlæg af haver, græsarealer og beplantning.', slug: 'anlaeg-udearealer' },
      { icon: Leaf, name: 'Beplantning', desc: 'Træer, buske og bede etableret og vedligeholdt.', slug: 'anlaeg-udearealer' },
      { icon: Fence, name: 'Hegn & Støttemure', desc: 'Hegn, støttemure og opkantning af arealer.', slug: 'anlaeg-udearealer' },
      { icon: Lightbulb, name: 'Udebelægning', desc: 'Belysning og udearealer skræddersyet til behov.', slug: 'anlaeg-udearealer' },
    ],
  },
  {
    icon: Recycle,
    title: 'Asbest & Miljø',
    items: [
      { icon: ShieldCheck, name: 'Asbestfjernelse', desc: 'Professionel og certificeret fjernelse af asbest.', slug: null },
      { icon: Flame, name: 'Miljøsanering', desc: 'Sanering af forurenede materialer og bygninger.', slug: null },
      { icon: Recycle, name: 'Affaldssortering', desc: 'Korrekt sortering og genanvendelse af byggeaffald.', slug: null },
      { icon: Leaf, name: 'Miljøgodkendt bortskaffelse', desc: 'Bortskaffelse via godkendte modtageranlæg.', slug: null },
    ],
  },
  {
    icon: Wrench,
    title: 'Service & Drift',
    items: [
      { icon: KeyRound, name: 'Vicevært service', desc: 'Løbende tilsyn og vedligehold for foreninger og virksomheder.', slug: 'vicevaert-service' },
      { icon: Snow, name: 'Snerydding', desc: 'Vintervedligeholdelse — snerydning, grusning og salt.', slug: 'snerydding' },
      { icon: Siren, name: 'Skadeservice', desc: 'Akut hjælp ved vandskade, stormskade og frostskade.', slug: 'skadeservice' },
      { icon: FileText, name: 'Serviceaftaler', desc: 'Faste aftaler på tilsyn og drift af arealer.', slug: 'vicevaert-service' },
      { icon: Wrench, name: 'Småreparationer', desc: 'Reparation og istandsættelse ved behov.', slug: 'vicevaert-service' },
    ],
  },
  {
    icon: FileWarning,
    title: 'Specialopgaver',
    items: [
      { icon: Banknote, name: 'Forsikringssager', desc: 'Skadesrapportering og udbedring i samarbejde med forsikringsselskab.', slug: 'skadeservice' },
      { icon: FileText, name: 'Billedokumentation', desc: 'Før/efter-billeder og dokumentation af forløb.', slug: 'skadeservice' },
      { icon: ClipboardCheck, name: 'Tilsyn & Kontrol', desc: 'Kvalitetskontrol og tilsyn på udført arbejde.', slug: null },
      { icon: HousePlus, name: 'Totalentrepriser', desc: 'Samlet levering fra grav til færdigt anlæg.', slug: null },
    ],
  },
  {
    icon: Ruler,
    title: 'Tømrer & Byg',
    items: [
      { icon: Ruler, name: 'Tømrerarbejde', desc: 'Tagværk, træbeklædning og bygningssnedkeri.', slug: 'toemrerarbejde' },
      { icon: HousePlus, name: 'Tilbygninger', desc: 'Udvidelser og tilbygninger til eksisterende bygninger.', slug: 'toemrerarbejde' },
      { icon: DoorClosed, name: 'Carport & Udhus', desc: 'Opførelse af carport, redskabsrum og udhus.', slug: 'toemrerarbejde' },
      { icon: PaintRoller, name: 'Reparation af træværk', desc: 'Vedligeholdelse og reparation af eksisterende træværk.', slug: 'toemrerarbejde' },
    ],
  },
  {
    icon: Wrench,
    title: 'VVS & Installationer',
    items: [
      { icon: Droplets, name: 'Vand & Sanitet', desc: 'Installation af vand og sanitet til private og erhverv.', slug: 'vvs-installationer' },
      { icon: Thermometer, name: 'Varme', desc: 'Varmeanlæg, radiatorer og gulvvarme.', slug: 'vvs-installationer' },
      { icon: Wrench, name: 'Rørudskiftning', desc: 'Udskiftning og reparation af rør og fittings.', slug: 'vvs-installationer' },
      { icon: Wrench, name: 'VVS-service', desc: 'Service og vedligeholdelse af eksisterende installationer.', slug: 'vvs-installationer' },
    ],
  },
  {
    icon: Zap,
    title: 'Elektriker & El',
    items: [
      { icon: Zap, name: 'El-installation', desc: 'Nye installationer til private og erhverv.', slug: 'elektriker' },
      { icon: Plug, name: 'Tilslutninger & Tavler', desc: 'Montering af tavler, stikkontakter og tilslutninger.', slug: 'elektriker' },
      { icon: Lightbulb, name: 'Belysning', desc: 'Montering af indendørs- og udendørsbelysning.', slug: 'elektriker' },
      { icon: Zap, name: 'Fejlfinding & Service', desc: 'Fejlfinding og service på eksisterende anlæg.', slug: 'elektriker' },
    ],
  },
  {
    icon: HousePlus,
    title: 'Totalentreprise',
    items: [
      { icon: HousePlus, name: 'Samlet byggelevering', desc: 'Fra grav og fundament til færdigt byggeri.', slug: 'totalentreprise' },
      { icon: Ruler, name: 'Tømrer, VVS & Elektriker', desc: 'Vi samler alle fag under ét projekt.', slug: 'totalentreprise' },
      { icon: ClipboardCheck, name: 'Byggeledelse', desc: 'Ét kontaktpunkt — vi koordinerer alt.', slug: 'totalentreprise' },
      { icon: Building2, name: 'Alt andet', desc: 'Skræddersyede løsninger til specialopgaver.', slug: 'totalentreprise' },
    ],
  },
];

export const stats = [
  { value: 'Fyn & Jylland', label: 'Fast arbejdsområde' },
  { value: '350 kr.', label: 'Timepris inkl. moms' },
  { value: '24t', label: 'Typisk svartid' },
];

export const benefits = [
  { icon: ShieldCheck, title: 'Faglig ekspertise', desc: 'Erhvervserfaren og certificeret til alle opgaver.' },
  { icon: Clock, title: 'Tilbageholdte deadlines', desc: 'Vi leverer til tiden — hver gang.' },
  { icon: Award, title: 'Kvalitetsgaranti', desc: 'Håndværk i topklasse med kvalitetssikring på alle projekter.' },
];

export const process = [
  { icon: Phone, title: '1. Kontakt', desc: 'Ring eller skriv til os. Vi lytter til dine behov og rådgiver dig.' },
  { icon: FileText, title: '2. Tilbud', desc: 'Du får et uforpligtende og transparent tilbud — hurtigt og præcist.' },
  { icon: ClipboardCheck, title: '3. Udførelse', desc: 'Vores erfarne team udfører opgaven professionelt og til tiden.' },
  { icon: CheckCircle2, title: '4. Færdigt', desc: 'Vi afleverer et resultat i topklasse — og rydder op efter os.' },
];

export const testimonials = [
  { name: 'Lars Pedersen', role: 'Privat, Odense', text: 'Fantastisk samarbejde fra start til slut. De gravede og lagde kloak for os — alt gik hurtigt og professionelt.', rating: 5 },
  { name: 'Anne Mortensen', role: 'Bygherre, Kerteminde', text: 'Vi har brugt Juhl & Damsgaard på flere projekter. Altid til tiden, og kvaliteten er i top. Klart anbefales.', rating: 5 },
  { name: 'Kasper Lund', role: 'Entreprenør, Svendborg', text: 'Faglig ekspertise og fair priser. De leverede asfalt- og betonarbejde til en stor opgave for os.', rating: 5 },
];

export const faqItems = [
  {
    category: 'Ydelser',
    q: 'Hvilke opgaver løser I?',
    a: 'Vi udfører alt inden for entreprenørarbejde — gravearbejde, kloak og dræn, asfalt og brolægning, beton og støbning, nedrivning, anlæg, asbestfjernelse, skadeservice, viceværtsservice og snerydding. Derudover har vi tømrere, VVS-installatører og elektrikere, så vi også tager byggeopgaver, installationer og totalentrepriser — kort sagt alt andet. Se det fulde overblik længere oppe.',
  },
  {
    category: 'Proces',
    q: 'Hvor hurtigt kan I komme ud?',
    a: 'Ved akutte skader rykker vi typisk ud samme dag. Ved planlagte opgaver aftaler vi en tid der passer dig — vi holder altid de deadlines vi sætter.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Får jeg et uforpligtende tilbud?',
    a: 'Ja. Du kan bruge vores prisberegner på hjemmesiden eller kontakte os direkte. Du modtager et transparent og uforpligtende tilbud, før vi går i gang.',
  },
  {
    category: 'Kunder',
    q: 'Arbejder I for både private og erhverv?',
    a: 'Ja, vi løser opgaver for både private boligejere, foreninger, kommuner og erhvervsvirksomheder — fra mindre reparationsopgaver til større totalentrepriser.',
  },
  {
    category: 'Område',
    q: 'Hvilket område dækker I?',
    a: 'Vi dækker hele Fyn og Jylland. Er du i tvivl om vi kører til din adresse, så kontakt os — så finder vi en løsning.',
  },
  {
    category: 'Asbest og miljø',
    q: 'Er I certificeret til asbestfjernelse?',
    a: 'Ja, vi er uddannede og certificeret til sikker asbestfjernelse og udsteder certifikat ved afsluttet opgave, så du har dokumentation for korrekt bortskaffelse.',
  },
  {
    category: 'Skadeservice',
    q: 'Kan I håndtere forsikringssager?',
    a: 'Ja. Vi har erfaring med skadesrapportering og udbedring i samarbejde med forsikringsselskaber, og vi sørger for fuld billedokumentation undervejs.',
  },
  {
    category: 'Serviceaftaler',
    q: 'Tilbyder I løbende service og vicevært?',
    a: 'Ja, vi tilbyder faste serviceaftaler med tilsyn, vedligehold og viceværtsservice for foreninger og virksomheder, samt vintervedligeholdelse med snerydding.',
  },
  {
    category: 'Betaling',
    q: 'Hvordan betaler jeg?',
    a: 'Du modtager en faktura med de aftalte betalingsbetingelser. Vi tilbyder fleksible betalingsvilkår efter aftale — også acconto på større opgaver.',
  },
  {
    category: 'Aflevering',
    q: 'Rydder I op efter arbejdet?',
    a: 'Ja. Vi efterlader altid byggepladsen ryddet og i orden, så du står med et færdigt og pænt resultat.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Hvad koster det at få lavet en opgave?',
    a: 'Prisen afhænger af opgavetype, adgangsforhold, materialer, maskiner, bortkørsel, tidsforbrug og om andre fag skal koordineres. Vores interne timepris er 350 kr. inkl. moms, men et færdigt tilbud bør altid vise både arbejdsløn, materialer, moms og en tydelig beskrivelse af opgaven.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Hvad skal jeg sende for at få et præcist tilbud?',
    a: 'Send adresse, billeder, mål, ønsket tidsplan og en kort beskrivelse af det ønskede resultat. Ved gravearbejde, kloak, beton og belægning er billeder af adgangsforhold og eksisterende areal meget nyttige. Ved større opgaver kan en besigtigelse være nødvendig.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Kan AI-tilbuddet bruges som endelig pris?',
    a: 'AI-tilbuddet er et hurtigt prisgrundlag og en god start. Endelig pris kan kræve gennemgang af billeder, adresse, materialevalg, mål og adgangsforhold. Vi bruger AI’en til at gøre tilbuddet hurtigere og mere struktureret, men vi kvalitetstjekker altid større opgaver.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Er materialer med i jeres tilbud?',
    a: 'Ja, tilbud skal som udgangspunkt indeholde både arbejde og materialer. Det kan for eksempel være stabilgrus, sand, rør, beton, armering, træ, fittings, kabler, fliser, asfalt, bortkørsel og andre relevante materialer afhængigt af opgaven.',
  },
  {
    category: 'Tilbud og pris',
    q: 'Kan I lave tilbud ud fra billeder?',
    a: 'Ja, ofte kan vi lave en første vurdering ud fra billeder og en beskrivelse. Hvis opgaven er kompleks, eller hvis jordbund, kloak, installationer eller bærende konstruktioner har betydning, anbefaler vi typisk en besigtigelse.',
  },
  {
    category: 'Område',
    q: 'Kører I til Odense?',
    a: 'Ja, vi udfører entreprenørarbejde i Odense og på resten af Fyn. Det gælder blandt andet gravearbejde, kloak og dræn, beton, asfalt, brolægning, tømrerarbejde, VVS, el, skadeservice og totalentreprise.',
  },
  {
    category: 'Område',
    q: 'Kører I til Kolding og Vejle?',
    a: 'Ja, vi løser opgaver i både Kolding, Vejle og resten af Jylland efter aftale. Send adresse og opgavebeskrivelse, så vurderer vi kørsel, tidsplan og prisgrundlag.',
  },
  {
    category: 'Område',
    q: 'Tager I mindre opgaver, hvis kunden bor langt væk?',
    a: 'Det afhænger af opgavens størrelse og planlægning. Ved mindre opgaver vurderer vi transport og tidsforbrug, så prisen stadig giver mening. Nogle gange kan mindre opgaver samles med andre opgaver i samme område.',
  },
  {
    category: 'Ydelser',
    q: 'Kan I tage hele projektet som totalentreprise?',
    a: 'Ja. Ved totalentreprise samler vi gravearbejde, kloak, beton, tømrer, VVS, elektriker og afsluttende arbejde i én samlet plan. Det giver kunden én kontaktperson og mindre koordinering mellem forskellige fag.',
  },
  {
    category: 'Ydelser',
    q: 'Laver I både gravearbejde og kloak?',
    a: 'Ja, vi kan håndtere gravearbejde sammen med kloak- og drænrelaterede opgaver. Hvor opgaven kræver autorisation eller særlig dokumentation, sørger vi for korrekt koordinering med relevante fagfolk.',
  },
  {
    category: 'Ydelser',
    q: 'Kan I lave fundament og betonarbejde?',
    a: 'Ja, vi udfører betonarbejde som fundamenter, sokler, gulve, plader, trapper og mindre konstruktioner. Vi tager højde for udgravning, bærelag, armering, betonleverance og efterbehandling.',
  },
  {
    category: 'Ydelser',
    q: 'Laver I asfalt, fliser og brolægning?',
    a: 'Ja. Vi hjælper med asfalt, brolægning, fliser, indkørsler, stier, gårdspladser, parkeringsarealer og retablering efter gravearbejde. Holdbarheden afhænger især af korrekt opbygning under belægningen.',
  },
  {
    category: 'Ydelser',
    q: 'Kan I hjælpe med tømrerarbejde?',
    a: 'Ja, vi udfører tømrerarbejde som reparationer, træbeklædning, tagværk, carport, udhus, tilbygninger og opgaver hvor tømrerfaget indgår i en samlet entreprise.',
  },
  {
    category: 'Ydelser',
    q: 'Kan I koordinere VVS og elektriker?',
    a: 'Ja. Ved opgaver hvor VVS eller el kræver autoriserede fagfolk, koordinerer vi arbejdet, så installationerne passer med resten af byggeriet og udføres korrekt.',
  },
  {
    category: 'Skadeservice',
    q: 'Hvad gør jeg ved akut vandskade?',
    a: 'Stop vandet hvis muligt, begræns skaden, tag billeder og kontakt os hurtigt. Vi hjælper med afdækning, åbning af konstruktioner, dokumentation, udbedring og koordinering med relevante fag.',
  },
  {
    category: 'Skadeservice',
    q: 'Kan I dokumentere skaden til forsikringen?',
    a: 'Ja, vi kan tage billeder før, under og efter arbejdet og beskrive hvad der er udført. Det giver et bedre grundlag for dialog med forsikringsselskabet.',
  },
  {
    category: 'Skadeservice',
    q: 'Udbedrer I også skaden efter oprydning?',
    a: 'Ja, vi kan ofte håndtere hele forløbet fra første indsats til færdig reparation. Det kan omfatte nedtagning, tørring, tømrerarbejde, VVS, el, beton, overflader og afsluttende oprydning.',
  },
  {
    category: 'Proces',
    q: 'Hvordan foregår en typisk opgave?',
    a: 'Først afklarer vi opgaven og indsamler billeder, mål og adresse. Derefter laver vi et tilbud eller aftaler besigtigelse. Når tilbuddet er godkendt, planlægger vi materialer, mandskab og tidsplan, udfører arbejdet og afleverer området ryddet.',
  },
  {
    category: 'Proces',
    q: 'Kommer I ud og besigtiger opgaven?',
    a: 'Ja, ved større eller mere komplekse opgaver giver det bedst mening at se forholdene på stedet. Ved mindre og enkle opgaver kan billeder og mål nogle gange være nok til en første vurdering.',
  },
  {
    category: 'Proces',
    q: 'Hvor lang tid tager en opgave?',
    a: 'Det afhænger af omfang, materialer, vejret, adgangsforhold og om flere fag skal ind over. Mindre opgaver kan ofte klares hurtigt, mens totalentrepriser og større grave-, beton- eller kloakopgaver kræver mere planlægning.',
  },
  {
    category: 'Proces',
    q: 'Kan arbejdet udføres mens vi bor i huset?',
    a: 'Ofte ja, men det afhænger af opgaven. Ved støj, støv, vandafbrydelse, strøm, gravearbejde tæt på adgangsveje eller skadeservice aftaler vi praktiske forhold på forhånd, så hverdagen påvirkes mindst muligt.',
  },
  {
    category: 'Proces',
    q: 'Hvad hvis der dukker uforudsete forhold op?',
    a: 'Hvis vi finder skjulte skader, ukendte installationer, dårlig jordbund eller andet uforudset, stopper vi op og forklarer situationen. Ekstraarbejde aftales, før vi går videre, så du ikke får overraskelser uden dialog.',
  },
  {
    category: 'Materialer',
    q: 'Kan jeg selv købe materialerne?',
    a: 'Det kan i nogle tilfælde aftales, men vi anbefaler ofte at lade os stå for materialerne. Så kan vi sikre korrekt kvalitet, mængde, levering og ansvar for at materialerne passer til opgaven.',
  },
  {
    category: 'Materialer',
    q: 'Bortskaffer I jord og byggeaffald?',
    a: 'Ja, vi kan håndtere bortkørsel og bortskaffelse af jord, beton, træ, belægning og byggeaffald via relevante løsninger. Ved særlige materialer som asbest eller forurenede materialer kræves korrekt håndtering og dokumentation.',
  },
  {
    category: 'Materialer',
    q: 'Retablerer I efter gravearbejde?',
    a: 'Ja, retablering kan indgå i opgaven. Det kan være jord, grus, fliser, asfalt, græs, belægning eller anden afslutning afhængigt af hvad området skal bruges til bagefter.',
  },
  {
    category: 'Kunder',
    q: 'Arbejder I for boligforeninger?',
    a: 'Ja, vi hjælper boligforeninger med vedligehold, belægning, kloak, dræn, skadeservice, viceværtservice, snerydning, mindre reparationer og større samlede projekter.',
  },
  {
    category: 'Kunder',
    q: 'Arbejder I for virksomheder?',
    a: 'Ja, vi udfører entreprenørarbejde for erhvervskunder, blandt andet adgangsveje, pladser, drift, skader, reparationer, beton, belægning, installationer og totalentrepriser.',
  },
  {
    category: 'Serviceaftaler',
    q: 'Kan vi få en fast serviceaftale?',
    a: 'Ja, vi kan lave faste aftaler på tilsyn, vedligehold, småreparationer, viceværtservice, snerydning og andre tilbagevendende opgaver for virksomheder, foreninger og ejendomme.',
  },
  {
    category: 'Serviceaftaler',
    q: 'Tilbyder I snerydning og vinterservice?',
    a: 'Ja, vi tilbyder snerydning, grusning og saltning efter aftale. Det er især relevant for foreninger, virksomheder og ejendomme, hvor adgangsveje og gangarealer skal holdes sikre.',
  },
  {
    category: 'Betaling',
    q: 'Skal der betales aconto?',
    a: 'Ved større opgaver kan aconto være relevant, især hvis der skal bestilles mange materialer eller reserveres flere fag over en længere periode. Det aftales tydeligt i tilbuddet.',
  },
  {
    category: 'Betaling',
    q: 'Er priserne inklusiv moms?',
    a: 'Når vi kommunikerer til private, viser vi som udgangspunkt priser inklusiv moms. I tilbud kan vi også vise beløb eksklusiv moms, moms og totalbeløb, så økonomien er tydelig.',
  },
  {
    category: 'Aflevering',
    q: 'Får jeg dokumentation på arbejdet?',
    a: 'Ved behov kan vi levere billeder, beskrivelser og dokumentation af udført arbejde. Det er især relevant ved skjulte installationer, kloak, dræn, skadeservice, forsikringssager og kvalitetskontrol.',
  },
  {
    category: 'Aflevering',
    q: 'Hvad sker der når arbejdet er færdigt?',
    a: 'Vi gennemgår arbejdet, rydder op og afleverer området i den aftalte stand. Hvis der er dokumentation, billeder eller opfølgningspunkter, samler vi det, så du har overblik efter afleveringen.',
  },
];
