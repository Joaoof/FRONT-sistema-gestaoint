export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarItem {
  id: string;
  source: 'EVENT' | 'REMINDER' | 'PAYABLE' | 'RECEIVABLE' | 'DELIVERY' | 'CONTRACT' | 'ORDER';
  sourceId: string;
  occurrenceId: string | null;
  title: string;
  description: string | null;
  color: string;
  allDay: boolean;
  startAt: string;
  endAt: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  link: string | null;
  location: string | null;
  amount: string | null;
  editable: boolean;
}

export const SOURCE_LABEL: Record<CalendarItem['source'], string> = {
  EVENT: 'Evento',
  REMINDER: 'Lembrete',
  PAYABLE: 'Conta a pagar',
  RECEIVABLE: 'Conta a receber',
  DELIVERY: 'Entrega',
  CONTRACT: 'Contrato',
  ORDER: 'Pedido',
};

export const SOURCE_ICON: Record<CalendarItem['source'], string> = {
  EVENT: '📅',
  REMINDER: '🔔',
  PAYABLE: '💸',
  RECEIVABLE: '💰',
  DELIVERY: '🚚',
  CONTRACT: '📑',
  ORDER: '🛒',
};

export const WEEKDAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_LONG_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // domingo = 0
  return x;
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatHM(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatRange(start: Date, end: Date, allDay: boolean): string {
  if (allDay) return 'O dia todo';
  if (sameDay(start, end)) return `${formatHM(start)} – ${formatHM(end)}`;
  return `${start.toLocaleDateString('pt-BR')} ${formatHM(start)} – ${end.toLocaleDateString('pt-BR')} ${formatHM(end)}`;
}

export function getViewRange(view: ViewMode, ref: Date): { start: Date; end: Date } {
  if (view === 'day') return { start: startOfDay(ref), end: endOfDay(ref) };
  if (view === 'week') return { start: startOfWeek(ref), end: endOfWeek(ref) };
  if (view === 'month') {
    // mês + completar grade até 6 semanas
    const ms = startOfMonth(ref);
    const me = endOfMonth(ref);
    const gridStart = startOfWeek(ms);
    const gridEnd = endOfWeek(me);
    return { start: gridStart, end: gridEnd };
  }
  // agenda: ±30 dias do ref
  return { start: addDays(ref, -2), end: addDays(ref, 60) };
}

export function navigateBy(view: ViewMode, ref: Date, dir: 1 | -1): Date {
  if (view === 'day') return addDays(ref, dir);
  if (view === 'week') return addDays(ref, 7 * dir);
  if (view === 'month') {
    const x = new Date(ref);
    x.setDate(1);
    x.setMonth(x.getMonth() + dir);
    return x;
  }
  return addDays(ref, 30 * dir);
}

export function getHeaderLabel(view: ViewMode, ref: Date): string {
  if (view === 'day') {
    return `${WEEKDAYS_LONG_PT[ref.getDay()]}, ${ref.getDate()} de ${MONTHS_PT[ref.getMonth()]} ${ref.getFullYear()}`;
  }
  if (view === 'week') {
    const s = startOfWeek(ref);
    const e = endOfWeek(ref);
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} – ${e.getDate()} de ${MONTHS_PT[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS_PT[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_PT[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
  }
  if (view === 'month') {
    return `${MONTHS_PT[ref.getMonth()]} ${ref.getFullYear()}`;
  }
  return 'Próximos eventos';
}

export function buildMonthGrid(ref: Date): Date[][] {
  const start = startOfWeek(startOfMonth(ref));
  const weeks: Date[][] = [];
  let cursor = start;
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
