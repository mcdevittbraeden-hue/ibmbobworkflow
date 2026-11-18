import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getDemoSession } from '@/lib/demoSession';
import { getCanvasData } from '@/lib/integrations/canvas';
import { AppNav } from '@/components/AppNav';
import { StudyCoachLoader } from '@/components/study/StudyCoachLoader';

export const metadata: Metadata = {
  title: 'Study Coach — FriarAI',
  description: 'Syllabus-based study plans, confidence check-ins and academic risk alerts.',
};

export default async function StudyPage() {
  await connection();
  const session = getDemoSession();
  const canvas = await getCanvasData(session.user.studentId, session.user.accessToken);

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="study" email={session.user.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <StudyCoachLoader canvas={canvas} />
      </main>
    </div>
  );
}
