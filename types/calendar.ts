export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  isAllDay: boolean;
  organizer?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  fetchedAt: string;
}
