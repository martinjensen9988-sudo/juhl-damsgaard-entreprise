import {
  HardHat, Droplets, Layers, Building2, Hammer, Trees,
  ShieldCheck, Clock, Award,
  Phone, FileText, ClipboardCheck, CheckCircle2,
  Siren, KeyRound, Snowflake, Recycle, Boxes, Pickaxe, Construction,
  Route, Waves, Trash2, Leaf, Snowflake as Snow, Wrench, Flame,
  ParkingCircle, Fence, Lightbulb, Shovel, Mountain, Truck, HousePlus, Banknote, FileWarning,
} from 'lucide-react';

export const services = [
  { icon: HardHat, title: 'Gravearbejde', desc: 'Professionelt gravearbejde til alle formål — fra fundamenter til ledningsgraving.' },
  { icon: Droplets, title: 'Kloak & Dræn', desc: 'Kloaklægning, omtilslutninger og drænløsninger udført efter gældende normer.' },
  { icon: Layers, title: 'Asfalt & Brolægning', desc: 'Asfaltlægning, brolægning og flisearbejde med holdbart resultat.' },
  { icon: Building2, title: 'Beton & Støbning', desc: 'Betonarbejde, fundamenter og støbning til både små og store projekter.' },
  { icon: Hammer, title: 'Nedrivning', desc: 'Sikker og effektiv nedrivning af bygninger og installationer.' },
  { icon: Trees, title: 'Anlæg & Udearealer', desc: 'Anlægsarbejde, haveanlæg og udearealer skræddersyet til din ejendom.' },
  { icon: Siren, title: 'Skadeservice', desc: 'Hurtig hjælp ved vandskade, stormskade og akutte skader — vi rykker ud når det gælder.' },
  { icon: KeyRound, title: 'Vicevært service', desc: 'Løbende vedligeholdelse, tilsyn og småreparationer for foreninger og virksomheder.' },
  { icon: Snowflake, title: 'Snerydding', desc: 'Vintervedligeholdelse med snerydding, grusning og holdbare arealer om vinteren.' },
];

// Det fulde overblik — ALT vi laver, grupperet i kategorier
export const allServices = [
  {
    icon: Pickaxe,
    title: 'Gravearbejde & Jord',
    items: [
      { icon: Shovel, name: 'Gravearbejde', desc: 'Alt gravearbejde fra spadetagning til store jordflytninger.' },
      { icon: Mountain, name: 'Jordforflytning', desc: 'Transport og placering af jord, fyld og skærver.' },
      { icon: HardHat, name: 'Fundamenter', desc: 'Grave- og fundamentarbejde til bygninger og anlæg.' },
      { icon: Pickaxe, name: 'Ledningsgraving', desc: 'Gravning og etablering af vand, el, fjernvarme og data.' },
      { icon: Truck, name: 'Terrænregulering', desc: 'Udjævning og tilpasning af terræn til byggeplads eller have.' },
    ],
  },
  {
    icon: Droplets,
    title: 'Kloak, Vand & Dræn',
    items: [
      { icon: Droplets, name: 'Kloaklægning', desc: 'Ny kloak og udskiftning af eksisterende ledninger.' },
      { icon: Waves, name: 'Drænløsninger', desc: 'Dræn omkring bygninger og på arealer mod fugt.' },
      { icon: Droplets, name: 'Omtilslutninger', desc: 'Tilslutning til offentlig kloak ogSeparatkloakering.' },
      { icon: Droplets, name: 'Regnvandshåndtering', desc: 'Regnvandsbassiner, faskiner og afledning af overfladevand.' },
    ],
  },
  {
    icon: Layers,
    title: 'Asfalt & Brolægning',
    items: [
      { icon: Layers, name: 'Asfaltlægning', desc: 'Kørearealer, stier og pladser med holdbar asfalt.' },
      { icon: ParkingCircle, name: 'Brolægning', desc: 'Brolagte arealer, indkørsler og torve.' },
      { icon: Layers, name: 'Flisearbejde', desc: 'Flise- og klinkelægning til udearealer.' },
      { icon: Route, name: 'Overfladebehandling', desc: 'Slurry, microasfalt og vedligeholdelse af eksisterende asfalt.' },
    ],
  },
  {
    icon: Building2,
    title: 'Beton & Støbning',
    items: [
      { icon: Building2, name: 'Betonfundamenter', desc: 'Fundamenter til bygninger, maskiner og hegn.' },
      { icon: Building2, name: 'Støbning', desc: 'Støbning af gulve, sokler og plader.' },
      { icon: Building2, name: 'Sokler & Trapper', desc: 'Betonstøbte sokler, trapper og detaljer.' },
      { icon: Building2, name: 'Industribeton', desc: 'Større betonarbejde til industri og erhverv.' },
    ],
  },
  {
    icon: Hammer,
    title: 'Nedrivning & Demontering',
    items: [
      { icon: Hammer, name: 'Nedrivning', desc: 'Sikker nedrivning af bygninger og installationer.' },
      { icon: Construction, name: 'Demontering', desc: 'Kontrolleret demontering med mulighed for genbrug.' },
      { icon: Trash2, name: 'Affaldssortering', desc: 'Sortering og bortskaffelse efter gældende regler.' },
      { icon: Boxes, name: 'Containerløsninger', desc: 'Containere til jord, beton og byggeaffald.' },
    ],
  },
  {
    icon: Trees,
    title: 'Anlæg & Udearealer',
    items: [
      { icon: Trees, name: 'Haveanlæg', desc: 'Anlæg af haver, græsarealer og beplantning.' },
      { icon: Leaf, name: 'Beplantning', desc: 'Træer, buske og bede etableret og vedligeholdt.' },
      { icon: Fence, name: 'Hegn & Støttemure', desc: 'Hegn, støttemure og opkantning af arealer.' },
      { icon: Lightbulb, name: 'Udebelægning', desc: 'Belysning og udearealer skræddersyet til behov.' },
    ],
  },
  {
    icon: Recycle,
    title: 'Asbest & Miljø',
    items: [
      { icon: ShieldCheck, name: 'Asbestfjernelse', desc: 'Professionel og certificeret fjernelse af asbest.' },
      { icon: Flame, name: 'Miljøsanering', desc: 'Sanering af forurenede materialer og bygninger.' },
      { icon: Recycle, name: 'Affaldssortering', desc: 'Korrekt sortering og genanvendelse af byggeaffald.' },
      { icon: Leaf, name: 'Miljøgodkendt bortskaffelse', desc: 'Bortskaffelse via godkendte modtageranlæg.' },
    ],
  },
  {
    icon: Wrench,
    title: 'Service & Drift',
    items: [
      { icon: KeyRound, name: 'Vicevært service', desc: 'Løbende tilsyn og vedligehold for foreninger og virksomheder.' },
      { icon: Snow, name: 'Snerydding', desc: 'Vintervedligeholdelse — snerydning, grusning og salt.' },
      { icon: Siren, name: 'Skadeservice', desc: 'Akut hjælp ved vandskade, stormskade og frostskade.' },
      { icon: FileText, name: 'Serviceaftaler', desc: 'Faste aftaler på tilsyn og drift af arealer.' },
      { icon: Wrench, name: 'Småreparationer', desc: 'Reparation og istandsættelse ved behov.' },
    ],
  },
  {
    icon: FileWarning,
    title: 'Specialopgaver',
    items: [
      { icon: Banknote, name: 'Forsikringssager', desc: 'Skadesrapportering og udbedring i samarbejde med forsikringsselskab.' },
      { icon: FileText, name: 'Billedokumentation', desc: 'Før/efter-billeder og dokumentation af forløb.' },
      { icon: ClipboardCheck, name: 'Tilsyn & Kontrol', desc: 'Kvalitetskontrol og tilsyn på udført arbejde.' },
      { icon: HousePlus, name: 'Totalentrepriser', desc: 'Samlet levering fra grav til færdigt anlæg.' },
    ],
  },
];

export const stats = [
  { value: '25+', label: 'År i branchen' },
  { value: '500+', label: 'Projekter gennemført' },
  { value: '100%', label: 'Tilfredse kunder' },
  { value: '24t', label: 'Svartid' },
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
    q: 'Hvilke opgaver løser I?',
    a: 'Vi udfører alt inden for entreprenørarbejde — gravearbejde, kloak og dræn, asfalt og brolægning, beton og støbning, nedrivning, anlæg, asbestfjernelse, skadeservice, viceværtsservice og snerydding. Se det fulde overblik længere oppe.',
  },
  {
    q: 'Hvor hurtigt kan I komme ud?',
    a: 'Ved akutte skader rykker vi typisk ud samme dag. Ved planlagte opgaver aftaler vi en tid der passer dig — vi holder altid de deadlines vi sætter.',
  },
  {
    q: 'Får jeg et uforpligtende tilbud?',
    a: 'Ja. Du kan bruge vores prisberegner på hjemmesiden eller kontakte os direkte. Du modtager et transparent og uforpligtende tilbud, før vi går i gang.',
  },
  {
    q: 'Arbejder I for både private og erhverv?',
    a: 'Ja, vi løser opgaver for både private boligejere, foreninger, kommuner og erhvervsvirksomheder — fra mindre reparationsopgaver til større totalentrepriser.',
  },
  {
    q: 'Hvilket område dækker I?',
    a: 'Vi dækker hele Fyn og Jylland. Er du i tvivl om vi kører til din adresse, så kontakt os — så finder vi en løsning.',
  },
  {
    q: 'Er I certificeret til asbestfjernelse?',
    a: 'Ja, vi er uddannede og certificeret til sikker asbestfjernelse og udsteder certifikat ved afsluttet opgave, så du har dokumentation for korrekt bortskaffelse.',
  },
  {
    q: 'Kan I håndtere forsikringssager?',
    a: 'Ja. Vi har erfaring med skadesrapportering og udbedring i samarbejde med forsikringsselskaber, og vi sørger for fuld billedokumentation undervejs.',
  },
  {
    q: 'Tilbyder I løbende service og vicevært?',
    a: 'Ja, vi tilbyder faste serviceaftaler med tilsyn, vedligehold og viceværtsservice for foreninger og virksomheder, samt vintervedligeholdelse med snerydding.',
  },
  {
    q: 'Hvordan betaler jeg?',
    a: 'Du modtager en faktura med de aftalte betalingsbetingelser. Vi tilbyder fleksible betalingsvilkår efter aftale — også acconto på større opgaver.',
  },
  {
    q: 'Rydder I op efter arbejdet?',
    a: 'Ja. Vi efterlader altid byggepladsen ryddet og i orden, så du står med et færdigt og pænt resultat.',
  },
];