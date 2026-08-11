import { localAreaText, serviceAreas } from '../lib/localAreas.js';

const image = {
  src: '/assets/juhl-damsgaard-logo.jpeg',
  alt: 'Juhl & Damsgaard Entreprise logo og dokumentation fra egne entreprenøropgaver',
};

const makeFaq = (name) => [
  {
    q: `Kan vi få et fast tilbud på ${name.toLowerCase()}?`,
    a: 'Ja. Vi gennemgår opgaven, materialer, adgangsforhold og tidsplan, før vi sender et konkret tilbud. Ved større eller uklare opgaver anbefaler vi en besigtigelse, så prisen bygger på de faktiske forhold.',
  },
  {
    q: 'Arbejder I både for private og erhverv?',
    a: 'Ja, vi løser opgaver for private boligejere, boligforeninger, virksomheder og andre bygherrer på Fyn og i Jylland.',
  },
  {
    q: 'Dækker I Fyn og Jylland?',
    a: `Ja. Vi dækker hele Fyn og Jylland efter aftale, blandt andet ${localAreaText}. Er du i tvivl om vi kører til din adresse, så kontakt os - så finder vi en løsning.`,
  },
  {
    q: 'Hvad skal vi sende for at få et tilbud?',
    a: 'Send gerne adresse, billeder, mål, ønsket tidsplan og en kort beskrivelse af opgaven. Jo mere konkret grundlag vi får, desto mere præcist kan vi beregne arbejde og materialer.',
  },
];

export const serviceSeoPages = {
  gravearbejde: {
    title: 'Gravearbejde på Fyn og i Jylland | Juhl & Damsgaard Entreprise',
    metaDescription:
      'Professionelt gravearbejde på Fyn og i Jylland. Vi hjælper med udgravning, fundament, ledningsgravning, terrænregulering og jordarbejde i Odense, Kolding og Vejle.',
    heading: 'Gravearbejde på Fyn og i Jylland',
    slug: 'gravearbejde',
    shortName: 'gravearbejde',
    image,
    areas: serviceAreas,
    lead:
      'Skal du bruge gravearbejde til fundament, kloak, dræn, forsyningsledninger eller terrænregulering, hjælper Juhl & Damsgaard Entreprise med en praktisk løsning fra første opmåling til ryddet arbejdsområde.',
    sections: [
      {
        h: 'Gravearbejde med styr på adgang, jord og næste fag',
        p: 'Godt gravearbejde handler ikke kun om at flytte jord. Det handler om at forstå den opgave, der kommer bagefter. Når der skal graves til fundament, indkørsel, kloak, kabler, fjernvarme eller haveanlæg, skal niveauer, fald, bærelag og adgangsforhold passe fra starten. Vi planlægger arbejdet, så udgravning, bortkørsel, opbygning og efterfølgende fag hænger sammen. Det giver en mere effektiv byggeplads og færre dyre tilretninger senere i forløbet.',
      },
      {
        h: 'Udgravning til fundament, ledninger og terræn',
        p: 'Vi udfører udgravning til sokler, punktfundamenter, støttemure, tilbygninger, carporte, rørføringer og tekniske installationer. Ved ledningsgravning tager vi højde for eksisterende installationer, dybder, afdækning og korrekt retablering. Ved terrænregulering arbejder vi med overflader, fald og afvanding, så arealet kan bruges til belægning, græs, kørsel eller videre byggeri. Vi kan også hjælpe med jordforflytning, planering, stabilgrus og klargøring til beton eller asfalt.',
      },
      {
        h: 'Lokal entreprenør i Odense, Kolding, Vejle og resten af området',
        p: 'Vi løser graveopgaver på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia, Middelfart og oplandet omkring de større byer. Lokalkendskab gør det nemmere at planlægge kørsel, materialer og tidsforbrug realistisk. Det er især vigtigt ved mindre opgaver, hvor transport, maskinstørrelse og adgangsforhold hurtigt kan påvirke økonomien. Vores mål er at give et tilbud, der passer til den konkrete adresse og ikke bare en generel standardpris.',
      },
      {
        h: 'Materialer, maskiner og dokumentation',
        p: 'Til gravearbejde kan der indgå bortkørsel af jord, levering af stabilgrus, sand, stenmel, skærver, drænmaterialer, fiberdug og andre materialer afhængigt af opgaven. Vi beregner både arbejdstid og materialer, så du får et tydeligt prisgrundlag. Ved behov dokumenterer vi arbejdet med billeder før, under og efter udførelsen. Det er nyttigt ved forsikringssager, byggesager, skjulte installationer og opgaver, hvor andre fag senere skal arbejde videre på samme område.',
      },
      {
        h: 'Fra lille opgave til samlet entreprise',
        p: 'Nogle kunder skal bare have gravet et mindre område op. Andre har brug for en samlet løsning med kloak, beton, tømrer, VVS, el og afsluttende belægning. Vi kan tage begge dele. Når gravearbejde indgår i en større entreprise, koordinerer vi rækkefølgen, så der ikke opstår ventetid mellem fagene. Det gør processen mere overskuelig for kunden, fordi der er én kontakt og én samlet plan for arbejdet.',
      },
    ],
    faq: makeFaq('gravearbejde'),
  },
  'kloak-draen': {
    title: 'Kloak og dræn på Fyn og i Jylland | Juhl & Damsgaard Entreprise',
    metaDescription:
      'Kloak, dræn, regnvandshåndtering og separatkloakering på Fyn og i Jylland. Få tilbud på kloakarbejde i Odense, Kolding, Vejle og omegn.',
    heading: 'Kloak og dræn med korrekt fald og dokumentation',
    slug: 'kloak-draen',
    shortName: 'kloak og dræn',
    image,
    areas: serviceAreas,
    lead:
      'Kloak- og drænarbejde skal udføres rigtigt første gang. Vi hjælper med udgravning, etablering, udskiftning og retablering, så vand, spildevand og regnvand ledes sikkert væk.',
    sections: [
      {
        h: 'Kloakarbejde der fungerer i praksis',
        p: 'Kloakarbejde kræver præcision, planlægning og respekt for både myndighedskrav og den bygning, arbejdet udføres ved. Forkert fald, dårlige samlinger eller mangelfuld retablering kan give fugt, lugt, sætninger og dyre følgeskader. Vi arbejder systematisk med opmåling, gravearbejde, rørføring, tilslutning og afsluttende kontrol, så løsningen passer til huset, grunden og den måde arealet skal bruges på bagefter.',
      },
      {
        h: 'Dræn omkring bygninger og fugtudsatte arealer',
        p: 'Dræn kan være nødvendigt ved fugt i kælder, vandtryk mod fundament, bløde arealer eller problemer med overfladevand. Vi vurderer jordbund, fald, afledning og eksisterende rør, før vi anbefaler en løsning. En drænopgave kan omfatte udgravning langs fundament, drænrør, sten, fiberdug, pumpebrønd, tilslutning og retablering af belægning eller have. Målet er at lede vandet væk kontrolleret, uden at skabe nye problemer andre steder på grunden.',
      },
      {
        h: 'Regnvand, faskiner og separatkloakering',
        p: 'Mange kommuner stiller krav til håndtering af regnvand, og separatkloakering kan være nødvendig, når spildevand og regnvand skal skilles ad. Vi hjælper med gravearbejde, rør, brønde, faskiner, regnvandsløsninger og klargøring til tilslutning. Ved opgaver i Odense, Kolding, Vejle, Fredericia, Middelfart og andre byer på Fyn og i Jylland tilpasser vi løsningen til lokale krav og de faktiske forhold på adressen.',
      },
      {
        h: 'Materialer og retablering er en del af tilbuddet',
        p: 'Et seriøst kloaktilbud skal ikke kun beskrive timer. Det bør også tage højde for rør, bøjninger, brønde, dæksler, sand, drænsten, fiberdug, bortkørsel, komprimering og retablering. Vi sørger for, at materialerne fremgår tydeligt, så du ved hvad tilbuddet dækker. Når arbejdet er færdigt, kan området retableres med grus, jord, fliser, asfalt eller anden belægning alt efter behov.',
      },
      {
        h: 'Samarbejde med relevante fagfolk',
        p: 'Kloakarbejde kan kræve autorisation og dokumentation afhængigt af opgavens karakter. Vi sørger for, at arbejdet håndteres korrekt og koordineres med relevante fagfolk, når der er krav om det. Det betyder, at du får en praktisk løsning, hvor gravearbejde, kloak, dræn, retablering og eventuel efterfølgende bygning hænger sammen i én plan.',
      },
    ],
    faq: makeFaq('kloak og dræn'),
  },
  'beton-stobning': {
    title: 'Beton og støbning på Fyn og i Jylland | Fundament, gulv og sokkel',
    metaDescription:
      'Betonarbejde, støbning, fundamenter, sokler og gulve på Fyn og i Jylland. Få tilbud på betonarbejde i Odense, Kolding, Vejle og omegn.',
    heading: 'Beton og støbning til solide byggerier',
    slug: 'beton-stobning',
    shortName: 'beton og støbning',
    image,
    areas: serviceAreas,
    lead:
      'Vi udfører betonarbejde til fundamenter, gulve, sokler, trapper, plader og mindre konstruktioner, hvor underlag, armering, udstøbning og finish skal passe sammen.',
    sections: [
      {
        h: 'Betonarbejde kræver et godt forarbejde',
        p: 'Et godt betonresultat starter før betonen kommer. Underlaget skal graves og opbygges korrekt, bærelag skal komprimeres, niveauforskelle skal afklares, og der skal tages stilling til armering, isolering, radonspærre, fald og afslutninger. Vi planlægger betonarbejdet ud fra den konkrete brug: om der er tale om fundament til byggeri, gulv i udhus, sokkel, plade, trappe eller en praktisk støbning omkring installationer.',
      },
      {
        h: 'Fundamenter, sokler og gulve',
        p: 'Vi hjælper med støbning af fundamenter til tilbygninger, carporte, skure, maskiner, hegn og tekniske installationer. Vi udfører også sokler, gulve, mindre plader, trapper og reparation af eksisterende beton. Ved gulve arbejder vi med planhed, tykkelse, fugtforhold og afsluttende overflade, så gulvet passer til den brug, det skal have. Ved fundamenter er præcision i mål, dybde og placering afgørende for de fag, der bygger videre.',
      },
      {
        h: 'Lokale opgaver på Fyn og i Jylland',
        p: 'Juhl & Damsgaard Entreprise udfører beton- og støbeopgaver på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Middelfart og Fredericia. Vi tilpasser maskiner, mandskab og leverancer efter adressen, adgangsforholdene og tidsplanen. Det er ofte koordineringen mellem jordarbejde, form, armering og betonleverance, der afgør om opgaven bliver effektiv. Derfor planlægger vi hele forløbet samlet.',
      },
      {
        h: 'Materialer, armering og levering',
        p: 'Et tilbud på betonarbejde kan omfatte udgravning, stabilgrus, sand, isolering, armeringsnet, kantforskalling, beton, pumpe, efterbehandling og oprydning. Vi beskriver materialer og arbejdsgange tydeligt, så du kan se hvad prisen bygger på. Ved mindre opgaver vurderer vi, om færdigbeton, blanding på stedet eller anden løsning er mest hensigtsmæssig. Valget afhænger af mængde, adgang og krav til styrke.',
      },
      {
        h: 'Når beton er en del af en større entreprise',
        p: 'Betonarbejde hænger ofte sammen med gravearbejde, kloak, tømrerarbejde, VVS og el. Hvis vi står for flere fag, sørger vi for at rør, kabler, afløb og gennemføringer tænkes ind før støbning. Det reducerer risikoen for efterfølgende gennembrydninger eller ekstraarbejde. Kunden får én samlet plan, hvor fundament, installationer og næste byggefase er koordineret fra starten.',
      },
    ],
    faq: makeFaq('beton og støbning'),
  },
  'asfalt-brolaegning': {
    title: 'Asfalt og brolægning på Fyn og i Jylland | Indkørsel, sti og plads',
    metaDescription:
      'Asfalt, brolægning, fliser og belægning til indkørsler, stier og pladser på Fyn og i Jylland. Få tilbud i Odense, Kolding, Vejle og omegn.',
    heading: 'Asfalt og brolægning der holder til brug',
    slug: 'asfalt-brolaegning',
    shortName: 'asfalt og brolægning',
    image,
    areas: serviceAreas,
    lead:
      'Vi etablerer asfalt, fliser, sten og brolagte arealer med korrekt opbygning, fald og afslutning, så indkørsler, stier, gårdspladser og erhvervsarealer fungerer i hverdagen.',
    sections: [
      {
        h: 'Belægning starter under overfladen',
        p: 'Når en indkørsel, sti eller plads skal holde, er det sjældent selve overfladen der er hele forklaringen. Bærelag, komprimering, afvanding, kanter og fald er afgørende. Vi vurderer belastning, jordbund, eksisterende belægning og ønsket udtryk, før vi anbefaler asfalt, fliser, brosten, stabilgrus eller en kombination. Det giver en belægning, der både ser ordentlig ud og kan tåle den daglige brug.',
      },
      {
        h: 'Asfalt til private, foreninger og erhverv',
        p: 'Asfalt er velegnet til kørearealer, parkeringspladser, adgangsveje, stier og større gårdspladser, hvor en jævn og robust overflade er vigtig. Vi hjælper med forarbejde, opbygning, kanter, afretning og koordinering af asfaltudlægning. Ved mindre arealer kan det være vigtigt at samle opgaver eller planlægge effektivt, så økonomien hænger sammen. Vi rådgiver ærligt om, hvornår asfalt er den rigtige løsning.',
      },
      {
        h: 'Brolægning, fliser og afslutninger',
        p: 'Brolægning og fliser giver et mere visuelt og fleksibelt udtryk til indkørsler, terrasser, gangarealer og gårdmiljøer. Vi arbejder med afretning, fuger, kantsten, opkantning, trin og overgange til eksisterende bygninger eller belægninger. En god afslutning betyder meget for både holdbarhed og udtryk. Derfor tager vi højde for afvanding, niveauforskelle og de steder, hvor belægningen møder døre, sokler, græs eller vej.',
      },
      {
        h: 'Fyn, Jylland, Odense, Kolding og Vejle',
        p: 'Vi udfører belægningsopgaver på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia og Middelfart. Lokale forhold som adgang, terræn, trafik og kommunale krav kan påvirke løsningen. Ved erhvervsarealer og foreninger planlægger vi ofte arbejdet, så adgang og drift kan fortsætte så smidigt som muligt. Ved private opgaver lægger vi vægt på en pæn aflevering og tydelig forventningsafstemning.',
      },
      {
        h: 'Materialer og tilbudsgrundlag',
        p: 'Et tilbud på asfalt eller brolægning kan omfatte bortgravning, bortkørsel, stabilgrus, afretningsgrus, stenmel, fliser, brosten, kantsten, asfalt, fugesand og komprimering. Vi beskriver omfanget tydeligt, så du kan se forskel på selve overfladen og det arbejde der sikrer holdbarheden. Hvis du ønsker et prisgrundlag, hjælper billeder, mål og en kort beskrivelse os med at lave et bedre tilbud.',
      },
    ],
    faq: makeFaq('asfalt og brolægning'),
  },
  toemrerarbejde: {
    title: 'Tømrerarbejde på Fyn og i Jylland | Tag, træværk og tilbygning',
    metaDescription:
      'Tømrerarbejde, tagværk, træbeklædning, carport, udhus og tilbygninger på Fyn og i Jylland. Få tilbud i Odense, Kolding, Vejle og omegn.',
    heading: 'Tømrerarbejde med styr på helheden',
    slug: 'toemrerarbejde',
    shortName: 'tømrerarbejde',
    image,
    areas: serviceAreas,
    lead:
      'Vi udfører tømrerarbejde som selvstændige opgaver eller som del af en samlet entreprise med gravearbejde, beton, VVS, el og færdig aflevering.',
    sections: [
      {
        h: 'Tømrerarbejde fra reparation til ny opførelse',
        p: 'Tømrerarbejde kan være alt fra udskiftning af træværk og mindre reparationer til tagkonstruktion, tilbygning, carport, udhus eller større byggeopgaver. Vi lægger vægt på præcise mål, stabile konstruktioner og løsninger der passer til den eksisterende bygning. Når tømrerarbejdet indgår i en større opgave, tænker vi underlag, fundament, fugt, installationer og efterfølgende finish med fra starten.',
      },
      {
        h: 'Tagværk, beklædning og udvendigt træ',
        p: 'Vi hjælper med tagværk, stern, udvendig beklædning, skure, carporte, hegn, træterrasser og vedligeholdelse af eksisterende træværk. Udvendigt træ skal udføres med korrekt ventilation, fastgørelse og materialevalg, så det kan holde til vind, regn og daglig brug. Vi rådgiver om praktiske løsninger, hvor både udseende, pris og levetid bliver taget med i beslutningen.',
      },
      {
        h: 'Tilbygninger og samspil med andre fag',
        p: 'Ved tilbygninger og ombygninger er koordinering mellem fagene afgørende. Fundament, beton, tømrer, VVS og el skal passe sammen i den rigtige rækkefølge. Juhl & Damsgaard Entreprise kan samle flere dele af opgaven, så kunden ikke selv skal styre alle håndværkere. Det gør processen mere overskuelig og reducerer risikoen for fejl, forsinkelser eller manglende afklaringer mellem fagene.',
      },
      {
        h: 'Lokalt arbejde på Fyn og i Jylland',
        p: 'Vi udfører tømrerarbejde på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia og Middelfart. For private betyder det ofte hurtig dialog og en praktisk plan for adgang, materialelevering og oprydning. For erhverv og foreninger handler det også om at begrænse driftsforstyrrelser. Vi aftaler tydeligt, hvornår arbejdet udføres, og hvordan området afleveres.',
      },
      {
        h: 'Materialer, kvalitet og tilbud',
        p: 'Et tilbud på tømrerarbejde kan omfatte træ, plader, beslag, skruer, beklædning, tagmaterialer, isolering, afdækning, stillads, bortkørsel og eventuel koordinering med andre fag. Vi beskriver både arbejde og materialer, så du kan se hvad der er inkluderet. Har du tegninger, mål eller billeder, bruger vi dem til at lave et mere præcist tilbud og en bedre vurdering af tidsforbruget.',
      },
    ],
    faq: makeFaq('tømrerarbejde'),
  },
  'vvs-installationer': {
    title: 'VVS-installationer på Fyn og i Jylland | Vand, varme og sanitet',
    metaDescription:
      'VVS-installationer, vand, varme, sanitet, rør og service på Fyn og i Jylland. Få tilbud på VVS-opgaver i Odense, Kolding, Vejle og omegn.',
    heading: 'VVS-installationer som del af et stærkt byggeforløb',
    slug: 'vvs-installationer',
    shortName: 'VVS-installationer',
    image,
    areas: serviceAreas,
    lead:
      'Vi koordinerer VVS-arbejde i renoveringer, tilbygninger, skadesager og entrepriser, så vand, varme og sanitet passer til resten af byggeriet.',
    sections: [
      {
        h: 'VVS skal planlægges tidligt',
        p: 'VVS-installationer påvirker mange andre dele af et byggeri. Rørføring, afløb, varme, sanitet og gennemføringer skal tænkes ind, før vægge lukkes, gulve støbes eller køkken og bad monteres. Vi hjælper med at koordinere VVS-opgaver, så gravearbejde, beton, tømrerarbejde og installationer ikke modarbejder hinanden. Det giver en mere effektiv proces og færre ændringer undervejs.',
      },
      {
        h: 'Vand, varme, sanitet og reparation',
        p: 'Vi håndterer VVS-relaterede opgaver som udskiftning af rør, montering af udstyr, klargøring til bad, bryggers, køkken, gulvvarme og tekniske installationer. På opgaver der kræver autorisation, koordinerer vi med relevante autoriserede fagfolk. Kunden får stadig én samlet dialog om opgaven, mens arbejdet udføres efter gældende krav og med den dokumentation, der er nødvendig.',
      },
      {
        h: 'Skader, renovering og totalentreprise',
        p: 'VVS indgår ofte i vandskader, renoveringer og totalentrepriser. Ved en skade kan det være nødvendigt at åbne konstruktioner, lokalisere problemet, udbedre installationen og efterfølgende lukke pænt igen. Ved renovering skal gamle installationer ofte tilpasses nye rum. Vi kan samle de praktiske fag omkring opgaven, så kunden ikke står med koordineringen mellem VVS, tømrer, beton og eventuel skadeservice.',
      },
      {
        h: 'Dækning på Fyn og i Jylland',
        p: 'Vi hjælper med VVS-installationer og koordinerede byggeopgaver på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Middelfart og Fredericia. Ved lokale opgaver vurderer vi adgang, materialebehov, tidsplan og hvilke fag der skal involveres. Det gør tilbuddet mere realistisk, fordi VVS sjældent står alene. Det er typisk en del af et samlet forløb, hvor flere arbejdsgange skal passe sammen.',
      },
      {
        h: 'Materialer og gennemsigtigt tilbud',
        p: 'Et VVS-relateret tilbud kan omfatte rør, fittings, ventiler, isolering, afløbsdele, sanitet, armaturer, arbejdstid, åbning og lukning af konstruktioner, bortkørsel og koordinering med andre fag. Vi beskriver materialer og arbejde, så du kan se hvad prisen dækker. Har du billeder, tegning eller en kort beskrivelse af installationen, kan vi hurtigere vurdere opgaven.',
      },
    ],
    faq: makeFaq('VVS-installationer'),
  },
  elektriker: {
    title: 'Elektriker på Fyn og i Jylland | El-installation og belysning',
    metaDescription:
      'El-installationer, belysning, tavler, stikkontakter og koordinering med autoriseret elektriker på Fyn og i Jylland. Få tilbud i Odense, Kolding og Vejle.',
    heading: 'Elektriker og el-arbejde koordineret med byggeriet',
    slug: 'elektriker',
    shortName: 'elektriker',
    image,
    areas: serviceAreas,
    lead:
      'Vi koordinerer el-arbejde i bygge- og renoveringsopgaver, så installationer, føringsveje, belysning og dokumentation passer ind i den samlede entreprise.',
    sections: [
      {
        h: 'El skal passe til rum, brug og tidsplan',
        p: 'El-arbejde handler om mere end at sætte stikkontakter op. Placering af tavle, føringsveje, belysning, udendørs strøm, data og tekniske installationer skal passe til rummenes funktion og de øvrige fag. Hvis el først tænkes ind for sent, kan det give ekstra huller, omlægninger og forsinkelser. Vi sørger for, at el bliver koordineret tidligt i bygge- eller renoveringsforløbet.',
      },
      {
        h: 'Installationer, belysning og service',
        p: 'Vi hjælper med opgaver omkring nye installationer, belysning, stikkontakter, tavler, udendørs strøm, tilslutninger og fejlfinding. På arbejde der kræver autorisation, samarbejder vi med relevante autoriserede elektrikere, så opgaven udføres korrekt. Kunden får en samlet plan, hvor el-arbejdet passer sammen med tømrerarbejde, beton, VVS, gravearbejde og eventuelle afsluttende overflader.',
      },
      {
        h: 'El i tilbygning, renovering og totalentreprise',
        p: 'Ved tilbygninger og totalentrepriser er el en central del af planlægningen. Der skal ofte afsættes plads til kabler, dåser, tavler, spots, udendørsbelysning og teknisk udstyr. Vi hjælper med at få arbejdet ind i den rigtige rækkefølge, så vægge og lofter ikke lukkes før installationerne er klar. Det giver et mere effektivt forløb og en pænere færdig aflevering.',
      },
      {
        h: 'Fyn, Jylland og lokale byer',
        p: 'Vi koordinerer elektrikeropgaver på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia og Middelfart. Lokale opgaver kræver ofte hurtig afklaring af adgang, tidsvinduer og samspil med andre håndværkere. Vi lægger vægt på tydelig kommunikation, så kunden ved hvornår arbejdet udføres, hvilke materialer der indgår, og hvordan opgaven afleveres.',
      },
      {
        h: 'Tilbud med materialer og afgrænsning',
        p: 'Et tilbud på el-relateret arbejde kan omfatte kabler, dåser, kontakter, belysning, tavledele, føringsveje, arbejdstid, dokumentation og koordinering. Vi beskriver tydeligt, hvad der er med, og hvad der eventuelt skal afklares af autoriseret elektriker. På den måde undgår du et uklart tilbud, hvor vigtige dele først dukker op som ekstraarbejde senere.',
      },
    ],
    faq: makeFaq('elektriker og el-arbejde'),
  },
  skadeservice: {
    title: 'Skadeservice på Fyn og i Jylland | Vandskade, stormskade og forsikring',
    metaDescription:
      'Skadeservice ved vandskade, stormskade, fugt og forsikringssager på Fyn og i Jylland. Hurtig hjælp i Odense, Kolding, Vejle og omegn.',
    heading: 'Skadeservice med hurtig indsats og dokumentation',
    slug: 'skadeservice',
    shortName: 'skadeservice',
    image,
    areas: serviceAreas,
    lead:
      'Ved vandskade, stormskade eller anden akut skade hjælper vi med afklaring, afdækning, udbedring og billedokumentation til forsikring og videre håndværk.',
    sections: [
      {
        h: 'Når en skade skal håndteres hurtigt',
        p: 'Skader på bygninger kræver hurtig og praktisk handling. Ved vandskade, stormskade, frostskade eller følgeskader efter utætheder er det vigtigt at stoppe udviklingen, dokumentere forholdene og planlægge udbedringen korrekt. Vi hjælper med de praktiske dele af skadeservice, så området bliver sikret, beskadigede dele håndteres, og der er et klart grundlag for det videre arbejde.',
      },
      {
        h: 'Vandskade, fugt og åbning af konstruktioner',
        p: 'Ved vandskader kan det være nødvendigt at åbne gulve, vægge eller lofter for at finde årsagen og fjerne skadede materialer. Vi arbejder systematisk, så der ikke fjernes mere end nødvendigt, men stadig nok til at problemet kan udbedres rigtigt. Når skaden er afklaret, kan vi koordinere tømrer, VVS, el, beton eller andet relevant arbejde, så bygningen kan bringes tilbage i brug.',
      },
      {
        h: 'Forsikringssager og dokumentation',
        p: 'Forsikringssager kræver ofte billeder, beskrivelser og tydelig dokumentation af skadens omfang. Vi kan hjælpe med billedokumentation før, under og efter arbejdet, så du har et bedre grundlag over for forsikringen. Vi beskriver også materialer, arbejdstid og nødvendige udbedringer i tilbuddet. Det gør processen mere overskuelig, især når flere fag skal ind over samme skade.',
      },
      {
        h: 'Akut hjælp på Fyn og i Jylland',
        p: 'Vi rykker ud på skadeservice på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia, Middelfart og nærliggende områder. Ved akutte situationer vurderer vi først, hvad der skal gøres for at begrænse skaden. Derefter lægger vi en plan for permanent udbedring. Den tilgang gør, at kunden både får hurtig hjælp og en ordentlig løsning på længere sigt.',
      },
      {
        h: 'Fra skade til færdig reparation',
        p: 'Skadeservice ender ofte med en mindre eller større renovering. Derfor er det en fordel, at vi kan samle flere fag omkring opgaven. Vi kan håndtere nedtagning, oprydning, affald, tømrerarbejde, installationer, overflader og afsluttende kvalitetssikring. Kunden får én kontaktperson og en tydelig plan for, hvordan skaden bliver udbedret fra første indsats til færdig aflevering.',
      },
    ],
    faq: makeFaq('skadeservice'),
  },
  totalentreprise: {
    title: 'Totalentreprise på Fyn og i Jylland | Én entreprenør til hele projektet',
    metaDescription:
      'Totalentreprise på Fyn og i Jylland. Vi samler gravearbejde, beton, tømrer, VVS, el, kloak og aflevering i én løsning i Odense, Kolding, Vejle og omegn.',
    heading: 'Totalentreprise fra første spadetag til færdig aflevering',
    slug: 'totalentreprise',
    shortName: 'totalentreprise',
    image,
    areas: serviceAreas,
    lead:
      'Med totalentreprise får du én samlet samarbejdspartner, der koordinerer fag, materialer, tidsplan og aflevering, så byggeprojektet bliver mere overskueligt.',
    sections: [
      {
        h: 'Én plan, én kontakt og et samlet ansvar',
        p: 'En totalentreprise er relevant, når opgaven involverer flere fag, og du ønsker en samlet løsning i stedet for selv at koordinere alle håndværkere. Vi planlægger rækkefølgen fra gravearbejde og fundament til tømrer, VVS, el, kloak, overflader og færdig aflevering. Det giver en mere enkel proces for kunden, fordi spørgsmål, tidsplan og praktiske beslutninger samles ét sted.',
      },
      {
        h: 'Fra jordarbejde til færdigt byggeri',
        p: 'Mange byggeprojekter starter med jord, dræn, kloak eller beton, men ender med flere fag end først forventet. En tilbygning kan kræve fundament, sokkel, træarbejde, el, varme, afløb og finish. En renovering kan kræve nedrivning, skadeservice, installationer og genopbygning. Vi kan samle delene i en realistisk plan, hvor fagene kommer ind på det rigtige tidspunkt.',
      },
      {
        h: 'Tidsplan og økonomi',
        p: 'Når flere fag skal arbejde på samme adresse, kan ventetid og misforståelser blive dyrt. Derfor lægger vi vægt på tydelig opgavestyring, klar afgrænsning og et tilbud, hvor både arbejde og materialer er beskrevet. Du får et bedre beslutningsgrundlag, fordi tilbuddet ikke kun viser en samlet pris, men også forklarer hvad der skal udføres, og hvilke materialer der forventes at indgå.',
      },
      {
        h: 'Totalentreprise på Fyn og i Jylland',
        p: 'Vi udfører totalentrepriser på Fyn og i Jylland, blandt andet i Odense, Kolding, Vejle, Fredericia og Middelfart. Vi tilpasser mandskab, leverancer og fag efter projektets størrelse og adresse. For private kan det være en tilbygning, garage, renovering eller udendørs anlæg. For erhverv og foreninger kan det være drift, ombygning, skader eller samlede byggeopgaver, hvor koordinering er vigtig.',
      },
      {
        h: 'Dokumentation og aflevering',
        p: 'En god totalentreprise slutter ikke bare med, at håndværkerne kører. Vi lægger vægt på oprydning, gennemgang, billedokumentation og en tydelig aflevering. Hvis opgaven kræver dokumentation fra autoriserede fag, forsikring eller efterfølgende drift, sørger vi for at det bliver tænkt ind. Målet er, at du får en færdig løsning, der kan bruges, vedligeholdes og dokumenteres fremover.',
      },
    ],
    faq: makeFaq('totalentreprise'),
  },
};

export const priorityServiceSlugs = Object.keys(serviceSeoPages);
export const shortServicePaths = priorityServiceSlugs.filter((slug) => slug !== 'gravearbejde');

for (const page of Object.values(serviceSeoPages)) {
  page.sections.push(
    {
      h: `Sådan vurderer vi en opgave med ${page.shortName}`,
      p: `Når vi skal beregne ${page.shortName}, ser vi ikke kun på antal timer. Vi vurderer adgangsforhold, materialeforbrug, maskiner, bortkørsel, underlag, koordinering med andre fag og den ønskede aflevering. To opgaver kan lyde ens, men være meget forskellige i praksis, hvis der er begrænset adgang, eksisterende installationer, skrånende terræn, krav til dokumentation eller særlige materialer. Derfor bygger vores tilbud på den konkrete adresse og de oplysninger, du sender. Det gør prisen mere realistisk og giver et bedre grundlag for at planlægge arbejdet rigtigt fra starten.`,
    },
    {
      h: `Få tilbud på ${page.shortName} i dit område`,
      p: `Vil du have et tilbud på ${page.shortName}, kan du sende billeder, mål, adresse og en kort beskrivelse af det ønskede resultat. Vi hjælper kunder på Fyn og i Jylland, blandt andet i ${localAreaText}. Vi kan give en første vurdering ud fra materialet, og ved større opgaver aftaler vi besigtigelse, så vi kan gennemgå adgang, materialer og tidsplan. Målet er et tydeligt tilbud, hvor arbejde, materialer, moms og opgavebeskrivelse hænger sammen, før arbejdet går i gang.`,
    },
    {
      h: 'En praktisk samarbejdspartner fra start til slut',
      p: `Mange opgaver bliver bedre, når én entreprenør har overblik over helheden. Hvis ${page.shortName} hænger sammen med gravearbejde, kloak, beton, tømrer, VVS, el, belægning eller skadeservice, kan vi koordinere rækkefølgen og sørge for, at næste fag ikke skal rette op på mangler fra det forrige. Det giver en roligere proces for kunden og en mere professionel aflevering. Vi lægger vægt på ryddelig kommunikation, realistiske tidsplaner og dokumentation, så du ved hvad der sker før, under og efter arbejdet. Den tilgang er især vigtig ved opgaver, hvor små fejl i starten kan påvirke økonomi, kvalitet og tidsplan senere.`,
    },
  );
}
