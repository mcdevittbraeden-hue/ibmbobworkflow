import type { CalendarEvent } from '@/types/calendar';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const day = new Date(e.start).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return groups;
}

export function CalendarStrip({ events }: { events: CalendarEvent[] }) {
  const upcoming = events.slice(0, 10);
  const grouped = groupByDay(upcoming);
  const days = Object.entries(grouped).slice(0, 4);

  if (!days.length) {
    return <p className="text-sm text-muted py-4 text-center">No upcoming events</p>;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {days.map(([day, dayEvents]) => (
        <div key={day}>
          <p className={`eyebrow mb-2 ${day === today ? '!text-ink' : ''}`}>
            {day === today ? '📅 Today' : day}
          </p>
          <div className="space-y-1.5">
            {dayEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-card-sm bg-white px-3 py-2 border border-line">
                {!e.isAllDay && (
                  <span className="text-xs text-muted font-semibold flex-shrink-0 mt-0.5 w-16">
                    {formatTime(e.start)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{e.title}</p>
                  {e.location && (
                    <p className="text-xs text-muted truncate">{e.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
