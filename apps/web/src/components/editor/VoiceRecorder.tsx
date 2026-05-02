// Gravador de voz baseado em MediaRecorder. Mostra um waveform "live" feito
// à mão a partir de AnalyserNode (sem libs). Após parar, devolve o Blob +
// duração; quem usa decide o que fazer (upload, transcribe, criar nota).

import { useEffect, useRef, useState } from 'react';

const PREFERRED_MIMES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function pickSupportedMime(): string {
  for (const m of PREFERRED_MIMES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

export interface RecordedClip {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

interface VoiceRecorderProps {
  onCancel: () => void;
  onComplete: (clip: RecordedClip) => void | Promise<void>;
  /** Texto exibido no estado idle/processando — quem usa controla o copy. */
  busyLabel?: string | null;
}

type Phase = 'idle' | 'recording' | 'processing';

export function VoiceRecorder({ onCancel, onComplete, busyLabel }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => cleanup(), []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickSupportedMime();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 96_000 } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const dur = Date.now() - startedAtRef.current;
        teardownAudio();
        setPhase('processing');
        Promise.resolve(onComplete({ blob, durationMs: dur, mimeType: finalMime })).catch((err) => {
          console.error('onComplete failed', err);
          setError('Erro ao processar a gravação.');
          setPhase('idle');
        });
      };

      // Waveform setup
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      recorder.start(250);
      startedAtRef.current = Date.now();
      setPhase('recording');
      setElapsedMs(0);
      tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
      drawLoop();
    } catch (err) {
      console.error('mic error', err);
      setError('Sem permissão pro microfone ou dispositivo indisponível.');
      cleanup();
    }
  }

  function stop() {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop();
  }

  function cancel() {
    cleanup();
    onCancel();
  }

  function cleanup() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      // remove o handler pra não disparar onComplete
      recorderRef.current.onstop = null;
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    teardownAudio();
  }

  function teardownAudio() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }

  function drawLoop() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const buffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--accent') || '#c0563a';
      ctx.beginPath();
      const slice = w / buffer.length;
      let x = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] ?? 128) / 128;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  return (
    <div className="rounded-lg border hairline bg-surface shadow-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`h-2 w-2 rounded-pill ${
            phase === 'recording' ? 'bg-danger animate-pulse' : 'bg-ink-3'
          }`}
          aria-hidden
        />
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-2">
          {phase === 'idle' && 'gravar'}
          {phase === 'recording' && 'gravando'}
          {phase === 'processing' && (busyLabel ?? 'transcrevendo…')}
        </span>
        <span className="ml-auto font-mono text-sm text-ink">
          {formatMs(elapsedMs)}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={560}
        height={56}
        className="w-full rounded-sm bg-surface-2"
      />

      {error ? (
        <p className="mt-3 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-2">
        {phase === 'idle' && (
          <>
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void start()}
              className="px-4 py-1.5 rounded-md bg-ink text-bg text-sm font-medium"
            >
              ● Iniciar
            </button>
          </>
        )}
        {phase === 'recording' && (
          <>
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={stop}
              className="px-4 py-1.5 rounded-md bg-danger text-white text-sm font-medium"
            >
              ■ Parar
            </button>
          </>
        )}
        {phase === 'processing' && (
          <button
            type="button"
            disabled
            className="px-4 py-1.5 rounded-md bg-ink/40 text-bg text-sm font-medium"
          >
            …
          </button>
        )}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
