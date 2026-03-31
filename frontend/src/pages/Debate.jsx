import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Cpu, Send, Shield, Swords, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addBot, evaluateDebate, getArguments, getRoom, startDebate, submitArgument } from '../services/api';

const WORD_LIMIT = 180;
const FALLBACK_TURN_SECONDS = 60;

function formatTimer(totalSeconds) {
  const safe = Math.max(0, totalSeconds || 0);
  const mins = Math.floor(safe / 60).toString().padStart(2, '0');
  const secs = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function getInitialTimer(room) {
  const candidates = [room?.secondsLeftInTurn, room?.turnTimeLeft, room?.remainingTurnSeconds, room?.timeLeft];
  const fromRoom = candidates.find((value) => Number.isFinite(Number(value)));
  return Number.isFinite(Number(fromRoom)) ? Number(fromRoom) : FALLBACK_TURN_SECONDS;
}

function getStatusText(isMyTurn, currentSpeaker) {
  if (!currentSpeaker) return 'Waiting...';
  if (currentSpeaker.isBot) return 'Bot is thinking...';
  return isMyTurn ? 'Your Turn' : 'Waiting...';
}

function sideClasses(isActive) {
  return isActive ? 'border-primary/60 shadow-lg shadow-primary/15 opacity-100' : 'border-border/70 opacity-70';
}

function sideTone(side, isActive) {
  if (side === 'FOR') {
    return isActive ? 'border-primary/60 bg-primary/5' : 'border-primary/30 bg-primary/5';
  }
  return isActive ? 'border-destructive/60 bg-destructive/5' : 'border-destructive/30 bg-destructive/5';
}

export default function Debate() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [args, setArgs] = useState([]);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(FALLBACK_TURN_SECONDS);
  const [activeMobileTab, setActiveMobileTab] = useState('FOR');
  const [botName, setBotName] = useState('');
  const [botSide, setBotSide] = useState('FOR');
  const [addingBot, setAddingBot] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const roomRes = await getRoom(roomId);
        if (!isMounted) return;
        if (roomRes.room.status === 'ended') {
          navigate(`/result/${roomId}`);
          return;
        }
        setRoom(roomRes.room);
        setTimer(getInitialTimer(roomRes.room));
        const argsRes = await getArguments(roomId);
        if (isMounted) setArgs(argsRes.arguments || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, navigate]);

  useEffect(() => {
    const tick = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || wordCount > WORD_LIMIT) return;
    setSubmitting(true);
    setError('');
    try {
      await submitArgument(roomId, inputText);
      setInputText('');
      const argsRes = await getArguments(roomId);
      setArgs(argsRes.arguments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async () => {
    if (!window.confirm('Are you sure you want to end the debate and evaluate?')) return;
    setEvaluating(true);
    try {
      await evaluateDebate(roomId);
      navigate(`/result/${roomId}`);
    } catch (err) {
      setError(err.message);
      setEvaluating(false);
    }
  };

  const handleAddBot = async (e) => {
    e.preventDefault();
    if (!botName.trim()) return;
    setAddingBot(true);
    setError('');
    try {
      await addBot(roomId, botName.trim(), botSide);
      setBotName('');
      const roomRes = await getRoom(roomId);
      setRoom(roomRes.room);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingBot(false);
    }
  };

  const handleStartDebate = async () => {
    setStarting(true);
    setError('');
    try {
      await startDebate(roomId);
      const roomRes = await getRoom(roomId);
      setRoom(roomRes.room);
      setTimer(getInitialTimer(roomRes.room));
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  if (!room) return <div className="px-6 py-10 text-sm text-muted-foreground">Loading debate arena...</div>;

  const myUid = localStorage.getItem('debate_uid');
  const isOwner = room.ownerId === myUid;
  const isDebateStarted = room.status === 'ongoing';
  const isMyTurn = room.currentTurn === myUid;
  const myUserObj = room.users.find((u) => u.uid === myUid);
  const mySide = myUserObj ? myUserObj.side : 'UNKNOWN';
  const currentSpeaker = room.users.find((u) => u.uid === room.currentTurn) || null;
  const currentSpeakerSide = currentSpeaker?.side || '';
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const canSubmit = isMyTurn && !submitting && wordCount > 0 && wordCount <= WORD_LIMIT;
  const speakerStatus = getStatusText(isMyTurn, currentSpeaker);
  const forUsers = room.users.filter((u) => u.side === 'FOR');
  const againstUsers = room.users.filter((u) => u.side === 'AGAINST');
  const canStartDebate = forUsers.length > 0 && againstUsers.length > 0;

  if (!isDebateStarted) {
    const lobbyFor = forUsers[0];
    const lobbyAgainst = againstUsers[0];

    const handleCopyRoomCode = async () => {
      try {
        await navigator.clipboard.writeText(String(room?.roomId || roomId || ''));
        setCopiedRoomCode(true);
        window.setTimeout(() => setCopiedRoomCode(false), 1500);
      } catch (e) {
        // Best-effort copy; ignore clipboard permission failures.
      }
    };

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 md:p-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Debate Arena Lobby</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{room.topic}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRoomCode}
              className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-sm"
            >
              <span className="text-muted-foreground">Room</span>
              <span className="font-mono text-foreground">{room.roomId}</span>
              <span className="opacity-0 transition-opacity group-hover:opacity-100 text-xs text-primary">
                click to copy
              </span>
            </button>
            {copiedRoomCode ? <span className="text-xs text-muted-foreground">Copied!</span> : null}
          </div>

          <div className="mt-8 flex items-stretch justify-between gap-3 overflow-x-auto">
            <div className="min-w-[210px] flex-1 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-4 w-4" />FOR</p>
              {lobbyFor ? (
                <div className="flex items-center gap-3">
                  <img src={lobbyFor.avatar} alt={`${lobbyFor.name}'s avatar`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} className="h-12 w-12 rounded-full border border-border/70 bg-muted" />
                  <div><p className="font-medium">{lobbyFor.name}</p><p className="text-xs text-muted-foreground">{lobbyFor.isBot ? 'BOT' : 'Player'}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Waiting for FOR participant...</p>}
            </div>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-2xl font-bold tracking-wider text-foreground">VS</div>

            <div className="min-w-[210px] flex-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Swords className="h-4 w-4" />AGAINST</p>
              {lobbyAgainst ? (
                <div className="flex items-center gap-3">
                  <img src={lobbyAgainst.avatar} alt={`${lobbyAgainst.name}'s avatar`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} className="h-12 w-12 rounded-full border border-border/70 bg-muted" />
                  <div><p className="font-medium">{lobbyAgainst.name}</p><p className="text-xs text-muted-foreground">{lobbyAgainst.isBot ? 'BOT' : 'Player'}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Waiting for AGAINST participant...</p>}
            </div>
          </div>

          {room.topicBrief ? <div className="mt-6 rounded-xl border border-border/70 bg-background p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Topic Brief</p><p className="mt-1 text-sm text-foreground">{room.topicBrief}</p></div> : null}
          <p className="mt-6 text-sm text-muted-foreground">Waiting for debate to start...</p>

          {isOwner ? (
            <div className="mt-6 space-y-4 rounded-xl border border-border/70 bg-background p-4">
              <h3 className="text-sm font-semibold">Owner Controls</h3>
              <form onSubmit={handleAddBot} className="flex flex-col gap-3 md:flex-row">
                <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Bot name/persona" className="h-10" />
                <select value={botSide} onChange={(e) => setBotSide(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                  <option value="FOR">FOR</option>
                  <option value="AGAINST">AGAINST</option>
                </select>
                <Button type="submit" variant="secondary" disabled={addingBot}>{addingBot ? 'Adding...' : 'Add Bot'}</Button>
              </form>
              <Button onClick={handleStartDebate} disabled={starting || !canStartDebate}>{starting ? 'Starting...' : canStartDebate ? 'Start Debate' : 'Need one FOR and one AGAINST'}</Button>
            </div>
          ) : null}
        </div>
        {error ? <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Error: {error}</div> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-44 pt-2 md:px-6">
      <div className="sticky top-20 z-50 mb-8 rounded-xl border border-border/70 bg-background/95 p-4 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Debate Topic</p>
            <h2 className="text-lg font-semibold md:text-xl">{room.topic}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Your Side: {mySide}</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex items-center gap-2">
              {currentSpeaker?.avatar ? (
                <img src={currentSpeaker.avatar} alt={`${currentSpeaker.name}'s avatar`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} className="h-8 w-8 rounded-full border border-border/60 bg-muted" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted"><User className="h-4 w-4 text-muted-foreground" /></div>
              )}
              <div className="text-sm"><p className="font-medium">{currentSpeaker?.name || 'Waiting for next speaker...'}</p><p className="text-xs text-muted-foreground">{currentSpeakerSide || '-'}</p></div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {currentSpeaker?.isBot ? <Cpu className="h-3.5 w-3.5 animate-pulse" /> : <User className="h-3.5 w-3.5" />}<span>{speakerStatus}</span>
            </div>
            {isOwner ? <Button variant="secondary" size="sm" onClick={handleEvaluate} disabled={evaluating}>{evaluating ? 'Evaluating...' : 'End & Evaluate'}</Button> : null}
          </div>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Error: {error}</div> : null}

      <div className="mt-2 grid gap-4 transition-all duration-300 lg:grid-cols-[160px_1fr_160px]">
        <div className="mb-1 flex items-center gap-2 lg:hidden">
          <Button type="button" variant={activeMobileTab === 'FOR' ? 'default' : 'secondary'} size="sm" onClick={() => setActiveMobileTab('FOR')}><Shield className="mr-1 h-4 w-4" />FOR</Button>
          <Button type="button" variant={activeMobileTab === 'AGAINST' ? 'default' : 'secondary'} size="sm" onClick={() => setActiveMobileTab('AGAINST')}><Swords className="mr-1 h-4 w-4" />AGAINST</Button>
        </div>

        <section className={`rounded-xl border p-3 ${sideClasses(currentSpeakerSide === 'FOR')} ${sideTone('FOR', currentSpeakerSide === 'FOR')} ${activeMobileTab !== 'FOR' ? 'hidden lg:block' : ''}`}>
          <div className="mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">FOR</h3></div>
          <div className="flex flex-wrap items-center gap-2">
            {forUsers.length === 0 ? <p className="text-xs text-muted-foreground">No players</p> : forUsers.map((u) => (
              <div key={u.uid} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2">
                <img src={u.avatar} alt={`${u.name}'s avatar`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} className="h-8 w-8 rounded-full border border-border/60 bg-muted" />
                <div className="min-w-0"><p className="truncate text-xs font-medium">{u.name}</p><p className="text-[11px] text-muted-foreground">{u.isBot ? 'BOT' : 'Player'}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4 lg:col-start-2 lg:col-end-3">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Argument Window</h3><p className="text-xs text-muted-foreground">Structured turns only</p></div>
          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {args.length === 0 ? <p className="text-sm text-muted-foreground">No arguments yet.</p> : args.map((arg, i) => {
              const speaker = room.users.find((u) => u.uid === arg.userId);
              const linePrefix = `${arg.side || 'UNKNOWN'} (${speaker?.name || 'Unknown'})`;
              return (
                <article key={`arg-${i}`} className="rounded-lg border border-border/70 bg-background p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{linePrefix}{speaker?.isBot ? ' • BOT' : ''}</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{arg.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`rounded-xl border p-3 ${sideClasses(currentSpeakerSide === 'AGAINST')} ${sideTone('AGAINST', currentSpeakerSide === 'AGAINST')} ${activeMobileTab !== 'AGAINST' ? 'hidden lg:block' : ''}`}>
          <div className="mb-3 flex items-center gap-2"><Swords className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">AGAINST</h3></div>
          <div className="flex flex-wrap items-center gap-2">
            {againstUsers.length === 0 ? <p className="text-xs text-muted-foreground">No players</p> : againstUsers.map((u) => (
              <div key={u.uid} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2">
                <img src={u.avatar} alt={`${u.name}'s avatar`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} className="h-8 w-8 rounded-full border border-border/60 bg-muted" />
                <div className="min-w-0"><p className="truncate text-xs font-medium">{u.name}</p><p className="text-[11px] text-muted-foreground">{u.isBot ? 'BOT' : 'Player'}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:p-4">
        <div className="mx-auto w-full max-w-7xl">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={!isMyTurn || submitting} placeholder={isMyTurn ? 'Build your argument with logic and evidence...' : 'Waiting for opponent...'} className="min-h-[88px]" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={wordCount > WORD_LIMIT ? 'text-destructive' : 'text-muted-foreground'}>{wordCount}/{WORD_LIMIT} words</span>
              {!isMyTurn ? <span className="text-muted-foreground">Waiting for opponent...</span> : <span className="text-muted-foreground">You can submit only on your turn.</span>}
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={!canSubmit}><Send className="mr-2 h-4 w-4" />{submitting ? 'Submitting...' : 'Submit Argument'}</Button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
