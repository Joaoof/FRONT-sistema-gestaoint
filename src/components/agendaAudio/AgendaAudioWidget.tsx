import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Headphones, Loader2, Play, Pause, X, Volume2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SUMMARIZE_AGENDA, SUMMARIZE_AGENDA_AUDIO } from '../../graphql/queries/calendar';

/**
 * Player de áudio do resumo da agenda. TDAH-friendly — ouvir é menos
 * cansativo que ler. Clica, espera ~5s, escuta o resumo do dia.
 */
type Mode = 'idle' | 'openai' | 'browser';

export function AgendaAudioWidget() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [openTranscript, setOpenTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [runOpenAi, { loading: loadingOpenAi }] = useMutation(SUMMARIZE_AGENDA_AUDIO, {
    onCompleted: (data) => {
      const r = data?.summarizeAgendaAudio;
      if (!r?.audioBase64) {
        toast.error('Sem áudio retornado.');
        return;
      }
      const url = `data:${r.mimeType};base64,${r.audioBase64}`;
      setAudioUrl(url);
      setTranscript(r.transcript);
      setMode('openai');
      setTimeout(() => audioRef.current?.play().catch(() => undefined), 50);
    },
    onError: (err) => {
      const msg = err.message || '';
      if (msg.includes('TTS_QUOTA_EXCEEDED')) {
        toast('Sem créditos OpenAI — tocando com voz do navegador.', { icon: '🔁' });
        runBrowserFallback();
      } else if (msg.includes('TTS_AUTH_FAILED')) {
        toast.error('Chave OpenAI inválida. Configure em .env e reinicie a API.');
      } else {
        toast.error(msg.slice(0, 120));
      }
    },
  });

  const [runText, { loading: loadingText }] = useMutation(SUMMARIZE_AGENDA, {
    onCompleted: (data) => {
      const text = data?.summarizeAgenda as string;
      setTranscript(text);
      setMode('browser');
      playBrowserTts(text);
    },
    onError: (err) => toast.error(err.message),
  });

  const playBrowserTts = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('Seu navegador não suporta síntese de voz.');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
    if (ptVoice) u.voice = ptVoice;
    u.onstart = () => setPlaying(true);
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const runBrowserFallback = () => {
    runText({ variables: { period: 'DAY' } });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    if (mode === 'browser') {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaying(true);
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setPlaying(false);
      } else if (transcript) {
        playBrowserTts(transcript);
      }
      return;
    }
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const generate = () => {
    if (loadingOpenAi || loadingText) return;
    runOpenAi({ variables: { period: 'DAY', voice: 'nova' } });
  };

  const reset = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setAudioUrl(null);
    setTranscript('');
    setMode('idle');
    setPlaying(false);
  };

  const loading = loadingOpenAi || loadingText;

  return (
    <div className="inline-flex items-center gap-1">
      {mode === 'idle' ? (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            title="Ouvir o resumo (voz da IA — exige créditos OpenAI)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Headphones className="w-3.5 h-3.5" />}
            {loading ? 'Gerando...' : 'Ouvir agenda'}
          </button>
          <button
            type="button"
            onClick={runBrowserFallback}
            disabled={loading}
            title="Usar voz do navegador (grátis, sem IA)"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition disabled:opacity-60"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-md">
          <button onClick={togglePlay} className="inline-flex items-center gap-1 text-xs font-medium text-violet-800 dark:text-violet-300 hover:text-violet-900">
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pausar' : 'Tocar'}
          </button>
          <span className="text-[10px] text-violet-500 dark:text-violet-400 ml-1">
            {mode === 'browser' ? 'navegador' : 'IA'}
          </span>
          <button
            onClick={() => setOpenTranscript(true)}
            className="text-[10px] underline text-violet-700 dark:text-violet-400 ml-1"
            title="Ver transcrição"
          >
            texto
          </button>
          <button onClick={reset} className="text-violet-400 hover:text-violet-600 ml-1" title="Fechar">
            <X className="w-3 h-3" />
          </button>
          {mode === 'openai' && audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          )}
        </div>
      )}

      {openTranscript && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenTranscript(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resumo da agenda</h2>
              <button onClick={() => setOpenTranscript(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 font-sans">{transcript}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
