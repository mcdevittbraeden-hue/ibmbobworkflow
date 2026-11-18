/**
 * Student Context Builder
 *
 * Calls all integration adapters in parallel and assembles
 * the unified StudentContext used by the AI and dashboard.
 */

import { getCanvasData } from '@/lib/integrations/canvas';
import { getBannerData } from '@/lib/integrations/banner';
import { getCalendarData } from '@/lib/integrations/calendar';
import { getCareerData } from '@/lib/integrations/career';
import { runAlertEngine } from '@/lib/twin/alertEngine';
import type { StudentContext } from '@/types/twin';

export async function buildStudentContext(
  studentId: string,
  name: string,
  email: string,
  accessToken: string
): Promise<StudentContext> {
  const [canvas, banner, calendar, career] = await Promise.all([
    getCanvasData(studentId, accessToken),
    getBannerData(studentId),
    getCalendarData(studentId, accessToken),
    getCareerData(studentId),
  ]);

  const alerts = runAlertEngine(canvas, banner, calendar, career);

  return {
    studentId,
    name,
    email,
    canvas,
    banner,
    calendar,
    career,
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
