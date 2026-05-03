// Captura de voz via Web Speech API nativa do navegador (SpeechRecognition).
// Sem upload, sem chamadas externas — transcrição roda no device.
//
// Suporte: Chrome/Edge (todos), Safari 14.1+ (parcial), Firefox: NÃO.
// Quando o navegador não suporta, exibimos mensagem amigável e desativamos.

import { useEffect, useRef, useState } from 'react';

// Web Speech API tem prefixo `webkit` em Safari. Tipos abaixo cobrem ambos.
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface VoiceRecorderProps {
  onCancel: () => void;
  /** Recebe a transcrição final ao confirmar. */
  onComplete: (text: string) => void | Promise<void>;
  /** Texto exibido na fase de processamento (ex: salvando…). */
  busyLabel?: string | null;
}

type Phase = 'idle' | 'listening' | 'processing';

export function VoiceRecorder({ onCancel, onComplete, busyLabel }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supported = Boolean(getRecognitionCtor());

  useEffect(() => () => stopInternal(), []);

  function stopInternal() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }

  function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('seu navegador não suporta reconhecimento de voz nativo.');
      return;
    }

    const rec = new Ctor();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let accumulated = '';

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        const transcript = r[0].transcript;
        if (r.isFinal) {
          accumulated += (accumulated ? ' ' : '') + transcript.trim();
          setFinalText(accumulated);
          interim = '';
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim.trim());
    };

    rec.onerror = (e) => {
      console.error('SpeechRecognition error', e.error);
      // 'no-speech' é benigno — usuário ficou em silêncio. Não mostra erro.
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      const friendly: Record<string, string> = {
        'not-allowed': 'permissão de microfone negada.',
        'service-not-allowed': 'reconhecimento bloqueado pelo sistema.',
        network: 'falha de rede no reconhecimento.',
        'audio-capture': 'sem microfone disponível.',
      };
      setError(friendly[e.error] ?? `erro de reconhecimento: ${e.error}`);
    };

    rec.onend = () => {
      // o browser pode encerrar sozinho após silêncio — se ainda estamos em
      // listening, paramos pra mostrar resultado final.
      setPhase((curr) => (curr === 'listening' ? 'idle' : curr));
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('failed to start recognition', err);
      setError('não consegui iniciar o reconhecimento.');
      return;
    }

    recognitionRef.current = rec;
    startedAtRef.current = Date.now();
    setPhase('listening');
    setFinalText('');
    setInterimText('');
    setElapsedMs(0);
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setPhase('idle');
  }

  async function confirm() {
    const txt = (finalText + ' ' + interimText).trim();
    if (!txt) {
      setError('nada foi capturado.');
      return;
    }
    stopInternal();
    setPhase('processing');
    try {
      await onComplete(txt);
    } catch (err) {
      console.error('onComplete failed', err);
      setError('erro ao salvar.');
      setPhase('idle');
    }
  }

  function cancel() {
    stopInternal();
    onCancel();
  }

  const showText = finalText || interimText;
  const transcript = (
    <p className="text-md text-ink leading-snug min-h-[60px]">
      {finalText ? <span>{finalText}</span> : null}
      {interimText ? (
        <span className="text-ink-3 italic">
          {finalText ? ' ' : ''}
          {interimText}
        </span>
      ) : null}
      {!showText ? (
        <span className="text-ink-3 italic">
          {phase === 'listening' ? 'pode falar…' : 'aperte iniciar e fale'}
        </span>
      ) : null}
    </p>
  );

  return (
    <div className="rounded-lg border hairline bg-surface shadow-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`h-2 w-2 rounded-pill ${
            phase === 'listening' ? 'bg-danger animate-pulse' : 'bg-ink-3'
          }`}
          aria-hidden
        />
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-2">
          {phase === 'idle' && (showText ? 'pausado' : 'gravar voz')}
          {phase === 'listening' && 'ouvindo…'}
          {phase === 'processing' && (busyLabel ?? 'salvando…')}
        </span>
        <span className="ml-auto font-mono text-sm text-ink">{formatMs(elapsedMs)}</span>
      </div>

      <div className="rounded-md bg-surface-2 p-3 mb-3">{transcript}</div>

      {!supported ? (
        <p className="text-xs text-warning mb-3">
          Seu navegador não suporta reconhecimento nativo (use Chrome ou Safari).
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-danger mb-3" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
        >
          Cancelar
        </button>

        {phase === 'listening' ? (
          <button
            type="button"
            onClick={stopListening}
            className="px-4 py-1.5 rounded-md bg-danger text-white text-sm font-medium"
          >
            ■ Parar
          </button>
        ) : phase === 'idle' && showText ? (
          <>
            <button
              type="button"
              onClick={start}
              disabled={!supported}
              className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink disabled:opacity-50"
            >
              ● Continuar
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              className="px-4 py-1.5 rounded-md bg-ink text-bg text-sm font-medium"
            >
              salvar
            </button>
          </>
        ) : phase === 'idle' ? (
          <button
            type="button"
            onClick={start}
            disabled={!supported}
            className="px-4 py-1.5 rounded-md bg-ink text-bg text-sm font-medium disabled:opacity-50"
          >
            ● Iniciar
          </button>
        ) : (
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
