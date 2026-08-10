import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TASK_TYPES = ['Gravearbejde', 'Kørsel', 'Maskinarbejde', 'Håndarbejde', 'Møde', 'Andet'];

// Map Danish voice keywords to task types
const KEYWORD_MAP = [
  { keys: ['grav', 'grave', 'graver'], type: 'Gravearbejde' },
  { keys: ['kør', 'køre', 'korsel', 'transport'], type: 'Kørsel' },
  { keys: ['maskin', 'gravemaskin', 'kran', 'bobcat'], type: 'Maskinarbejde' },
  { keys: ['møde', 'mode', 'moter'], type: 'Møde' },
  { keys: ['hånd', 'hand', 'snikkar', 'tømr', 'maler', 'vvs', 'elektrik'], type: 'Håndarbejde' },
];

function detectTaskType(text) {
  const lower = text.toLowerCase();
  for (const { keys, type } of KEYWORD_MAP) {
    if (keys.some((k) => lower.includes(k))) return type;
  }
  return 'Håndarbejde';
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim();
}

// Find best matching project from the spoken text
function matchProject(text, projects) {
  if (!projects.length) return null;
  const normalized = normalize(text);
  // Look for "projekt X" segment
  const projMatch = normalized.match(/projekt\s+(.+)$/);
  const query = projMatch ? projMatch[1] : normalized;
  if (!query) return null;

  // Best match: project name contained in query, or query contained in project name
  let best = null;
  let bestScore = 0;
  for (const p of projects) {
    const pname = normalize(p.name);
    if (!pname) continue;
    let score = 0;
    if (query === pname) score = 100;
    else if (query.includes(pname)) score = 80 - (query.length - pname.length);
    else if (pname.includes(query)) score = 70 - (pname.length - query.length);
    else {
      // word overlap
      const qWords = new Set(query.split(/\s+/).filter((w) => w.length > 2));
      const pWords = new Set(pname.split(/\s+/).filter((w) => w.length > 2));
      const overlap = [...qWords].filter((w) => pWords.has(w)).length;
      if (overlap) score = 30 + overlap * 10;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 30 ? best : null;
}

export default function StemmeTidsregistrering({ projects, onEntryCreated }) {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(null); // { start_ts, project_id, project_name, task_type, description }
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState([]); // recent command log
  const recRef = useRef(null);

  // Setup SpeechRecognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'da-DK';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        setTranscript(finalText);
        setInterim('');
        handleCommand(finalText);
      }
    };
    rec.onerror = (e) => {
      console.error('Speech error', e);
      setListening(false);
      if (e.error === 'not-allowed') {
        toast({ title: 'Mikrofon adgang nægtet', variant: 'destructive' });
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
    };
     
  }, [projects]);

  // Ticking timer
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed((Date.now() - active.start_ts) / 1000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const startListening = () => {
    if (!recRef.current) return;
    setTranscript('');
    setInterim('');
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      // already started
    }
  };

  const stopListening = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  const handleCommand = (text) => {
    const lower = normalize(text);
    if (lower === 'stop' || lower.startsWith('stop ') || lower.startsWith('slut') || lower.startsWith('afslut')) {
      stopTimer();
      setLog((l) => [{ cmd: text, action: 'stop', ts: Date.now() }, ...l].slice(0, 5));
      return;
    }
    if (lower.startsWith('start') || lower.startsWith('starte')) {
      const project = matchProject(text, projects);
      const taskType = detectTaskType(text);
      if (!project) {
        toast({ title: 'Kunne ikke finde projekt', description: 'Sig f.eks. "Start gravemaskine, projekt Nørrebro"', variant: 'destructive' });
        setLog((l) => [{ cmd: text, action: 'no-project', ts: Date.now() }, ...l].slice(0, 5));
        return;
      }
      setActive({
        start_ts: Date.now(),
        project_id: project.id,
        project_name: project.name,
        task_type: taskType,
        description: text,
      });
      toast({ title: 'Timer startet', description: `${taskType} på ${project.name}` });
      setLog((l) => [{ cmd: text, action: `start → ${taskType} / ${project.name}`, ts: Date.now() }, ...l].slice(0, 5));
      return;
    }
    toast({ title: 'Uforstået kommando', description: 'Brug "Start ..." eller "Stop"', variant: 'destructive' });
    setLog((l) => [{ cmd: text, action: 'unrecognized', ts: Date.now() }, ...l].slice(0, 5));
  };

  const stopTimer = async () => {
    if (!active) {
      toast({ title: 'Ingen aktiv timer', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const hours = Math.max(0.017, (Date.now() - active.start_ts) / 3600000); // min 1 min
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.TimeEntry.create({
        project_id: active.project_id,
        project_name: active.project_name,
        user_name: me?.full_name || '',
        date: new Date().toISOString().slice(0, 10),
        hours: Math.round(hours * 100) / 100,
        description: active.description,
        task_type: active.task_type,
      });
      toast({ title: 'Timer gemt', description: `${Math.round(hours * 100) / 100} timer på ${active.project_name}` });
      setActive(null);
      onEntryCreated?.();
    } catch (e) {
      console.error(e);
      toast({ title: 'Kunne ikke gemme timer', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
  };

  if (!supported) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
        <MicOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          Stemmestyring understøttes ikke i denne browser. Brug Chrome eller Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-5 md:p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Mic className="w-6 h-6 text-amber-400" /> Stemmestyret tidsregistrering
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Sig: <span className="text-amber-300 font-medium">"Start gravemaskine, projekt Nørrebro"</span> eller <span className="text-amber-300 font-medium">"Stop"</span>
            </p>
          </div>

          {active ? (
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-mono font-bold text-amber-400 tabular-nums">{fmtTime(elapsed)}</div>
              <div className="text-xs text-slate-300 mt-0.5">{active.task_type} · {active.project_name}</div>
            </div>
          ) : (
            <div className="text-right text-slate-400 text-sm">
              <div className="text-3xl font-mono">00:00:00</div>
              <div className="mt-0.5">Ingen aktiv timer</div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          {!active ? (
            <Button
              size="lg"
              onClick={startListening}
              disabled={listening}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              {listening ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Lytter...</>
              ) : (
                <><Mic className="w-5 h-5" /> Start stemme</>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={stopTimer}
              disabled={saving}
              variant="destructive"
              className="font-semibold"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
              {saving ? 'Gemmer...' : 'Stop & gem'}
            </Button>
          )}

          {listening && (
            <Button size="lg" variant="outline" onClick={stopListening} className="border-slate-600 text-white hover:bg-slate-700">
              <MicOff className="w-5 h-5" /> Annuller
            </Button>
          )}
        </div>

        {(transcript || interim) && (
          <div className="mt-4 bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Du sagde</div>
            <div className="text-white">
              {transcript}
              {interim && <span className="text-slate-400 italic"> {interim}</span>}
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Seneste kommandoer</div>
            {log.map((l, i) => (
              <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                <span className="text-slate-500">›</span>
                <span className="italic">"{l.cmd}"</span>
                <span className="text-amber-400">→ {l.action}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400 flex items-center gap-4 flex-wrap">
          <span>💡 Genkendte arbejdstyper: {TASK_TYPES.join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}