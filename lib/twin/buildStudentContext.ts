/**
 * Student Context Builder
 *
 * Calls all three integration adapters in parallel and assembles
 * the unified StudentContext used by the AI and dashboard.
 */

import { getCanvasData } from '@/lib/integrations/canvas';
import { getBannerData } from '@/lib/integrations/banner';
import { getCalendarData } from '@/lib/integrations/calendar';
import { runAlertEngine } from '@/lib/twin/alertEngine';
import type { StudentContext } from '@/types/twin';

export async function buildStudentContext(
  studentId: string,
  name: string,
  email: string,
  accessToken: string
): Promise<StudentContext> {
  const [canvas, banner, calendar] = await Promise.all([
    getCanvasData(studentId, accessToken),
    getBannerData(studentId),
    getCalendarData(studentId, accessToken),
  ]);

  const alerts = runAlertEngine(canvas, banner, calendar);

  return {
    studentId,
    name,
    email,
    canvas,
    banner,
    calendar,
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
