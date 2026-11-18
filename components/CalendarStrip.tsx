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
    return <p className="text-sm text-gray-400 py-4 text-center">No upcoming events</p>;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {days.map(([day, dayEvents]) => (
        <div key={day}>
          <p className={`text-xs font-semibold mb-2 ${day === today ? 'text-[#1B2A5A]' : 'text-gray-500'}`}>
            {day === today ? '📅 Today' : day}
          </p>
          <div className="space-y-1.5">
            {dayEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 border border-gray-100">
                {!e.isAllDay && (
                  <span className="text-xs text-[#C5A900] font-semibold flex-shrink-0 mt-0.5 w-16">
                    {formatTime(e.start)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                  {e.location && (
                    <p className="text-xs text-gray-500 truncate">{e.location}</p>
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
