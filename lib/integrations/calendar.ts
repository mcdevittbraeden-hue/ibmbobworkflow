/**
 * Microsoft 365 Calendar Integration Adapter (Microsoft Graph API)
 *
 * Production: Uses Microsoft Graph with the student's Azure AD OAuth2 token.
 * Development: Returns realistic mock data when accessToken is not a real token.
 *
 * Scope required: Calendars.Read
 * Graph endpoint: https://graph.microsoft.com/v1.0/me/events
 */

import type { CalendarData, CalendarEvent } from '@/types/calendar';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function getCalendarData(studentId: string, accessToken: string): Promise<CalendarData> {
  // Use mock in dev if token looks like a placeholder
  if (!accessToken || accessToken === 'mock' || !process.env.AUTH_MICROSOFT_ENTRA_ID_ID) {
    return getMockCalendarData();
  }

  const start = new Date().toISOString();
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${GRAPH_BASE}/me/events?$select=id,subject,start,end,location,isAllDay,organizer&$filter=start/dateTime ge '${start}' and end/dateTime le '${end}'&$orderby=start/dateTime&$top=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) throw new Error(`Graph API error: ${res.status}`);

  const json = await res.json() as { value: Array<{
    id: string;
    subject: string;
    start: { dateTime: string };
    end: { dateTime: string };
    location?: { displayName: string };
    isAllDay: boolean;
    organizer?: { emailAddress: { name: string } };
  }> };

  const events: CalendarEvent[] = json.value.map((e) => ({
    id: e.id,
    title: e.subject,
    start: e.start.dateTime,
    end: e.end.dateTime,
    location: e.location?.displayName,
    isAllDay: e.isAllDay,
    organizer: e.organizer?.emailAddress.name,
  }));

  return { events, fetchedAt: new Date().toISOString() };
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

function getMockCalendarData(): CalendarData {
  const today = new Date();
  const d = (offsetDays: number, hour: number, min = 0) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, min, 0, 0);
    return dt.toISOString();
  };

  const events: CalendarEvent[] = [
    { id: 'e1', title: 'ACC 302 Lecture', start: d(0, 9), end: d(0, 10), location: 'Feinstein Hall 204', isAllDay: false },
    { id: 'e2', title: 'FIN 341 Lecture', start: d(0, 11), end: d(0, 12), location: 'Ruane Center 110', isAllDay: false },
    { id: 'e3', title: 'Investment Club Meeting', start: d(0, 18), end: d(0, 19), location: 'Slavin Center 112', isAllDay: false },
    { id: 'e4', title: 'MGT 310 Lab', start: d(1, 14), end: d(1, 15, 30), location: 'Feinstein 301', isAllDay: false },
    { id: 'e5', title: 'Office Hours — Prof. Martinez', start: d(1, 10), end: d(1, 11), location: 'Feinstein 405', isAllDay: false },
    { id: 'e6', title: 'BUS 220 Lecture', start: d(2, 13), end: d(2, 14), location: 'Ruane 215', isAllDay: false },
    { id: 'e7', title: 'Career Fair Prep Workshop', start: d(3, 15), end: d(3, 16, 30), location: 'Slavin Center Ballroom', isAllDay: false },
    { id: 'e8', title: 'DWC 201 Seminar', start: d(4, 9), end: d(4, 10, 30), location: 'Aquinas Hall 201', isAllDay: false },
    { id: 'e9', title: 'ACC 302 Exam 2', start: d(7, 9), end: d(7, 10, 30), location: 'TBA', isAllDay: false },
    { id: 'e10', title: 'Thanksgiving Break', start: d(10, 0), end: d(14, 0), location: '', isAllDay: true },
  ];

  return { events, fetchedAt: new Date().toISOString() };
}
