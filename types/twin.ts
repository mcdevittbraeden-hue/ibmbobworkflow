export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertType =
  | 'deadline_urgent'
  | 'grade_at_risk'
  | 'degree_requirement_gap'
  | 'scheduling_conflict'
  | 'missing_submission'
  | 'academic_standing'
  | 'application_deadline';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestedAction: string;
  link?: string;
  source: 'canvas' | 'banner' | 'calendar' | 'career';
}

export interface StudentContext {
  studentId: string;
  name: string;
  email: string;
  canvas: import('./canvas').CanvasData;
  banner: import('./banner').BannerData;
  calendar: import('./calendar').CalendarData;
  career: import('./career').CareerData;
  alerts: Alert[];
  generatedAt: string;
}
