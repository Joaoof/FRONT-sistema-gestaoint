import { useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Headphones, Loader2, Play, Pause, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SUMMARIZE_AGENDA_AUDIO } from '../../graphql/queries/calendar';

/**
 * Player de áudio do resumo da agenda. TDAH-friendly — ouvir é menos
 * cansativo que ler. Clica, espera ~5s, escuta o resumo do dia.
 */
export function AgendaAudioWidget() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [openTranscript, setOpenTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [run, { loading }] = useMutation(SUMMARIZE_AGENDA_AUDIO, {
    onCompleted: (data) => {
      const r = data?.summarizeAgendaAudio;
      if (!r?.audioBase64) {
        toast.error('Sem áudio retornado.');
        return;
      }
      const url = `data:${r.mimeType};base64,${r.audioBase64}`;
      setAudioUrl(url);
      setTranscript(r.transcript);
      setTimeout(() => audioRef.current?.play().catch(() => undefined), 50);
    },
    onError: (err) => toast.error(err.message),
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const generate = () => {
    if (loading) return;
    run({ variables: { period: 'DAY', voice: 'nova' } });
  };

  return (
    <div className="inline-flex items-center gap-1">
      {!audioUrl ? (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          title="Ouvir o resumo da agenda do dia"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Headphones className="w-3.5 h-3.5" />}
          {loading ? 'Gerando...' : 'Ouvir agenda'}
        </button>
      ) : (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-md">
          <button onClick={togglePlay} className="inline-flex items-center gap-1 text-xs font-medium text-violet-800 dark:text-violet-300 hover:text-violet-900">
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pausar' : 'Tocar'}
          </button>
          <button
            onClick={() => setOpenTranscript(true)}
            className="text-[10px] underline text-violet-700 dark:text-violet-400 ml-1"
            title="Ver transcrição"
          >
            texto
          </button>
          <button onClick={() => { setAudioUrl(null); setTranscript(''); }} className="text-violet-400 hover:text-violet-600 ml-1" title="Fechar">
            <X className="w-3 h-3" />
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
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
