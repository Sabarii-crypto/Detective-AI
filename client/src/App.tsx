import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BadgeAlert, BookOpen, Check, ChevronDown, Clock3, Fingerprint, FolderOpen, Lightbulb, LoaderCircle, LockKeyhole, MessageCircle, Plus, Search, Send, Shield, UserRound, X } from 'lucide-react';
import { api, type Clue, type Game, type Result, type SavedCase, type Suspect } from './api';
import './cases.css';

type ChatLine = { speaker: 'you' | 'suspect'; text: string };

function restoreInterview(history: NonNullable<Game['interrogationHistory']>): Record<string, ChatLine[]> {
  return history.reduce<Record<string, ChatLine[]>>((restored, entry) => {
    restored[entry.suspectId] = [
      ...(restored[entry.suspectId] || []),
      { speaker: 'you', text: entry.question },
      { speaker: 'suspect', text: entry.answer },
    ];
    return restored;
  }, {});
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState<'evidence' | 'suspects' | 'notes'>('evidence');
  const [selected, setSelected] = useState('');
  const [interview, setInterview] = useState<Record<string, ChatLine[]>>({});
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<Suspect | null>(null);
  const [expandedClue, setExpandedClue] = useState('');
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState('');
  const [openingCase, setOpeningCase] = useState('');

  const loadCases = async () => {
    setCasesLoading(true);
    setCasesError('');
    try {
      setSavedCases(await api.list());
    } catch (e) {
      setCasesError(e instanceof Error ? e.message : 'Could not load saved cases.');
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  const start = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    setHints([]);
    setInterview({});
    setSelected('');
    setQuestion('');
    setConfirm(null);
    setExpandedClue('');
    try {
      const created = await api.start();
      setGame(created);
      setSection('evidence');
      void loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start a case.');
    } finally {
      setBusy(false);
    }
  };

  const openCase = async (id: string) => {
    setOpeningCase(id);
    setCasesError('');
    setError('');
    try {
      const restored = await api.get(id);
      const finalReport = restored.status === 'complete' ? await api.result(id) : null;
      setGame(restored);
      setResult(finalReport);
      setHints(restored.usedHints || []);
      setInterview(restoreInterview(restored.interrogationHistory || []));
      setSelected('');
      setQuestion('');
      setConfirm(null);
      setExpandedClue('');
      setSection('evidence');
    } catch (e) {
      setCasesError(e instanceof Error ? e.message : 'Could not reopen this case.');
    } finally {
      setOpeningCase('');
    }
  };

  const showCases = () => {
    setGame(null);
    setResult(null);
    setConfirm(null);
    setError('');
    void loadCases();
  };

  const discover = async (clue: Clue) => {
    if (!game || clue.discovered) return;
    try {
      await api.discover(game.id, clue.id);
      setGame({ ...game, discoveredClueIds: [...game.discoveredClueIds, clue.id], clues: game.clues.map((item) => item.id === clue.id ? { ...item, discovered: true } : item) });
      setExpandedClue(clue.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not inspect clue.');
    }
  };

  const sendQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!game || !selected || !question.trim()) return;
    const asked = question.trim();
    const suspect = game.suspects.find((item) => item.id === selected);
    if (!suspect) return;
    setQuestion('');
    setSending(true);
    setInterview((previous) => ({ ...previous, [selected]: [...(previous[selected] || []), { speaker: 'you', text: asked }] }));
    try {
      const response = await api.interrogate(game.id, selected, asked);
      setInterview((previous) => ({ ...previous, [selected]: [...(previous[selected] || []), { speaker: 'suspect', text: response.answer }] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the suspect.');
    } finally {
      setSending(false);
    }
  };

  const requestHint = async () => {
    if (!game) return;
    try {
      const response = await api.hint(game.id);
      setHints((previous) => [...previous, response.hint]);
      setGame({ ...game, hintsUsed: response.hintsUsed });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No hint available.');
    }
  };

  const accuse = async (suspect: Suspect) => {
    if (!game) return;
    setBusy(true);
    setError('');
    try {
      setResult(await api.accuse(game.id, suspect.id));
      setGame({ ...game, status: 'complete', accusedSuspectId: suspect.id });
      setConfirm(null);
      void loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit accusation.');
    } finally {
      setBusy(false);
    }
  };

  const discovered = game?.clues.filter((clue) => game.discoveredClueIds.includes(clue.id)) || [];

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); showCases(); }}>
        <span className="brand-mark"><Fingerprint size={19} /></span><span>AI MYSTERY ROOM</span>
      </a>
      <div className="top-meta"><span className="status-dot" /> CASE FILES <span className="top-divider" /> <span>NO. {game ? '00482' : '00000'}</span></div>
      <div className="top-actions">
        <button className="nav-case-button" onClick={showCases}><FolderOpen size={14} /> My Cases</button>
        <button className="icon-btn help-btn" aria-label="Help" onClick={() => setError('Investigate each clue, question suspects, then choose who you believe is responsible.')}>?</button>
      </div>
    </header>

    {!game ? <>
      <section className="hero" id="home">
        <div className="hero-top"><div className="eyebrow"><span /> YOUR NEXT CASE AWAITS</div><div className="case-stamp"><Fingerprint size={24} /><span>DETECTIVE<br />DIVISION</span></div></div>
        <h1>Some truths<br />prefer <em>the dark.</em></h1>
        <p className="hero-copy">A locked room. A handful of suspects. One story that doesn’t add up. Step inside and find out what really happened.</p>
        <button className="primary-btn start-btn" onClick={start} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Preparing the case…</> : <><Plus size={16} /> New Mystery <ArrowRight size={17} /></>}</button>
        <div className="hero-bottom"><span><LockKeyhole size={14} /> FICTIONAL CASES. REAL DEDUCTION.</span><span>EST. 2024</span></div>
        <div className="case-preview"><div className="preview-tab">RECENTLY SEALED <span>FILE 047</span></div><div className="preview-content"><span className="preview-icon"><BadgeAlert size={21} /></span><div><strong>The Bellweather Incident</strong><small>UNSOLVED · 4 PERSONS OF INTEREST</small></div><span className="sealed">SEALED</span></div></div>
      </section>

      <section className="saved-cases" id="saved-cases">
        <div className="saved-cases-heading"><div><div className="eyebrow"><span /> YOUR ARCHIVE</div><h2>My Cases</h2><p>Return to an investigation or open a fresh case file.</p></div><button className="secondary-btn new-case-button" onClick={start} disabled={busy}><Plus size={15} /> New Mystery</button></div>
        {casesLoading ? <div className="cases-message"><LoaderCircle className="spin" size={17} /> Loading saved cases…</div> : casesError ? <div className="cases-message cases-error">{casesError}<button className="text-action" onClick={() => void loadCases()}>Try again</button></div> : savedCases.length === 0 ? <div className="cases-empty"><FolderOpen size={20} /><span>No saved mysteries yet. Start a new case to add it to your archive.</span></div> : <div className="saved-case-list">{savedCases.map((saved) => <article className="saved-case-card" key={saved.id}><div className="saved-case-icon"><BadgeAlert size={18} /></div><div className="saved-case-info"><h3>{saved.title}</h3><span>{formatDate(saved.createdAt)}</span></div><span className={`saved-case-status ${saved.status}`}>{saved.status === 'complete' ? 'CASE CLOSED' : 'IN PROGRESS'}</span><button className="continue-case-button" onClick={() => void openCase(saved.id)} disabled={openingCase !== ''}>{openingCase === saved.id ? <><LoaderCircle className="spin" size={14} /> Opening…</> : <>Continue Case <ArrowRight size={14} /></>}</button></article>)}</div>}
      </section>
    </> : result ? <section className="results-view">
      <button className="back-link" onClick={showCases}><ArrowLeft size={15} /> MY CASES</button>
      <div className="result-card"><div className={`result-icon ${result.correct ? 'success' : 'failure'}`}>{result.correct ? <Check /> : <X />}</div><div className="eyebrow centered">CASE CLOSED · FINAL REPORT</div><h1>{result.correct ? 'Well done, Detective.' : 'The case is closed.'}</h1><p className="result-outcome">{result.correct ? 'Your accusation was correct.' : `The culprit was ${result.culpritName}.`}</p><div className="report-grid"><div><span className="report-label">THE CULPRIT</span><strong>{result.culpritName}</strong></div><div><span className="report-label">YOUR SCORE</span><strong>{result.score}<small> / 100</small></strong></div><div><span className="report-label">HINTS USED</span><strong>{result.hintsUsed} <small>of 3</small></strong></div></div><div className="solution-block"><span className="report-label">WHAT REALLY HAPPENED</span><p>{result.solution}</p><span className="report-label">MOTIVE</span><p>{result.motive}</p></div><div className="decisive"><span className="report-label">DECISIVE EVIDENCE</span>{result.decisiveClues.map((clue) => <span key={clue.id} className="decisive-chip"><Check size={13} />{clue.title}</span>)}</div><button className="primary-btn" onClick={showCases}>My Cases <ArrowRight size={16} /></button><button className="secondary-btn result-new-case" onClick={start} disabled={busy}><Plus size={14} /> New Mystery</button></div>
    </section> : <>
      <div className="case-heading"><div><div className="eyebrow"><span /> ACTIVE INVESTIGATION</div><h1>{game.title}</h1><p>{game.introduction}</p></div><div className="case-status"><span>CASE STATUS</span><strong><i /> OPEN</strong></div></div>
      <div className="investigation-grid"><section className="main-column"><div className="case-description"><span className="section-kicker">INCIDENT REPORT <span>01 / 03</span></span><p>{game.description}</p></div><div className="tabs"><button className={section === 'evidence' ? 'active' : ''} onClick={() => setSection('evidence')}><Search size={15} /> Evidence <b>{discovered.length}</b></button><button className={section === 'suspects' ? 'active' : ''} onClick={() => setSection('suspects')}><UserRound size={15} /> Persons of interest <b>{game.suspects.length}</b></button><button className={section === 'notes' ? 'active' : ''} onClick={() => setSection('notes')}><BookOpen size={15} /> Timeline</button></div>
        {section === 'evidence' && <div className="clue-list">{game.clues.map((clue, index) => <article key={clue.id} className={`clue-card ${clue.discovered ? 'found' : ''}`}><button className="clue-main" onClick={() => clue.discovered ? setExpandedClue(expandedClue === clue.id ? '' : clue.id) : void discover(clue)}><span className="clue-index">{String(index + 1).padStart(2, '0')}</span><span className="clue-symbol">{clue.discovered ? <Fingerprint size={18} /> : <LockKeyhole size={17} />}</span><span className="clue-title-wrap"><strong>{clue.title}</strong><small>{clue.discovered ? clue.location : 'LOCATION UNVERIFIED'}</small></span><span className={`clue-state ${clue.discovered ? 'found-label' : ''}`}>{clue.discovered ? 'EXAMINED' : 'INVESTIGATE'}</span><ChevronDown className={expandedClue === clue.id ? 'rotated' : ''} size={15} /></button>{expandedClue === clue.id && clue.discovered && <div className="clue-detail"><p>{clue.description}</p>{clue.relevance && <small>{clue.relevance}</small>}</div>}</article>)}</div>}
        {section === 'suspects' && <div className="suspect-grid">{game.suspects.map((suspect, index) => <button className={`suspect-card ${selected === suspect.id ? 'selected' : ''}`} key={suspect.id} onClick={() => setSelected(suspect.id)}><div className="suspect-head"><span className="suspect-avatar">{suspect.name.split(' ').map((word) => word[0]).join('')}</span><span className="suspect-number">P.O.I. {String(index + 1).padStart(2, '0')}</span></div><strong>{suspect.name}</strong><small>{suspect.role}</small><p>{suspect.background}</p><span className="interrogate-link">INTERROGATE <ArrowRight size={12} /></span></button>)}</div>}
        {section === 'notes' && <div className="timeline">{game.timeline.map((event, index) => <div className="timeline-row" key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{event}</p></div>)}</div>}
      </section>
      <aside className="side-column"><div className="side-card"><div className="side-title"><span className="side-icon"><MessageCircle size={15} /></span><div><strong>Interrogation room</strong><small>ASK A PERSON OF INTEREST</small></div></div>{selected ? <><div className="selected-person"><span className="person-avatar">{game.suspects.find((suspect) => suspect.id === selected)?.name.split(' ').map((word) => word[0]).join('')}</span><span><strong>{game.suspects.find((suspect) => suspect.id === selected)?.name}</strong><small>{game.suspects.find((suspect) => suspect.id === selected)?.role}</small></span><button onClick={() => setSelected('')} aria-label="Close interview"><X size={14} /></button></div><div className="chat-window">{!interview[selected]?.length && <div className="opening-statement"><span>INITIAL STATEMENT</span><p>“{game.suspects.find((suspect) => suspect.id === selected)?.initialStatement}”</p></div>}{(interview[selected] || []).map((line, index) => <div className={`chat-line ${line.speaker}`} key={index}><span>{line.speaker === 'you' ? 'YOU' : 'RESPONSE'}</span><p>{line.text}</p></div>)}{sending && <div className="typing"><i /><i /><i /></div>}</div><form className="question-form" onSubmit={sendQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="Ask a question…" /><button aria-label="Send question" disabled={sending || !question.trim()}><Send size={15} /></button></form></> : <div className="interview-empty"><MessageCircle size={21} /><p>Select a person of interest to begin questioning.</p><button onClick={() => setSection('suspects')}>VIEW SUSPECTS <ArrowRight size={12} /></button></div>}</div>
        <div className="side-card hint-card"><div className="side-title"><span className="side-icon"><Lightbulb size={15} /></span><div><strong>Need a nudge?</strong><small>PROGRESSIVE FIELD NOTES</small></div></div>{hints.length ? <div className="hint-stack">{hints.map((hint, index) => <div className="hint-note" key={index}><span>HINT 0{index + 1}</span><p>{hint}</p></div>)}</div> : <p className="hint-copy">A small clue can change everything. Ask for guidance when the trail goes cold.</p>}<button className="secondary-btn" onClick={requestHint} disabled={game.hintsUsed >= 3}><Lightbulb size={14} />{game.hintsUsed >= 3 ? 'All hints used' : `Request a hint · ${3 - game.hintsUsed} left`}</button><small className="penalty-note">−10 POINTS PER HINT</small></div>
        <div className="progress-card"><div><span>INVESTIGATION PROGRESS</span><strong>{String(discovered.length).padStart(2, '0')}<small> / {String(game.clues.length).padStart(2, '0')}</small></strong></div><div className="progress-track"><i style={{ width: `${Math.round(discovered.length / game.clues.length * 100)}%` }} /></div><p>CLUES EXAMINED</p></div>
        <button className="accuse-btn" onClick={() => setConfirm(game.suspects[0])}><Shield size={16} /> Make an accusation <ArrowRight size={15} /></button><p className="accuse-note">Your final accusation will close this case.</p>
      </aside></div>
    </>}

    {error && <div className="toast"><span>{error}</span><button onClick={() => setError('')}><X size={15} /></button></div>}
    {confirm && game && !result && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirm(null); }}><section className="accuse-modal"><button className="modal-close" onClick={() => setConfirm(null)}><X size={17} /></button><div className="eyebrow centered">FINAL DECISION</div><h2>Who did it?</h2><p>Choose the person you believe is responsible. You get one final accusation.</p><div className="accuse-options">{game.suspects.map((suspect) => <button className={confirm.id === suspect.id ? 'chosen' : ''} onClick={() => setConfirm(suspect)} key={suspect.id}><span className="suspect-avatar">{suspect.name.split(' ').map((word) => word[0]).join('')}</span><span><strong>{suspect.name}</strong><small>{suspect.role}</small></span>{confirm.id === suspect.id && <Check size={16} />}</button>)}</div><button className="primary-btn submit-accusation" disabled={busy} onClick={() => void accuse(confirm)}>{busy ? 'Submitting…' : <>Confirm accusation <ArrowRight size={15} /></>}</button><button className="cancel-link" onClick={() => setConfirm(null)}>I need more time</button></section></div>}
    <footer className="footer"><span>AI MYSTERY ROOM <i>·</i> A GAME OF OBSERVATION</span><span><Clock3 size={13} /> EVERY DETAIL MATTERS</span></footer>
  </main>;
}
