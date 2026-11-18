import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { getDemoSession } from '@/lib/demoSession';
import { getCanvasData } from '@/lib/integrations/canvas';
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B2A5A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#1B2A5A] text-sm font-black">F</span>
          </div>
          <span className="font-bold text-lg">FriarAI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
            Dashboard
          </Link>
          <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white">Study Coach</span>
          <Link href="/career" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
            Career
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm hidden sm:block">{session.user.email}</span>
          <span className="rounded-full bg-[#C5A900] px-2.5 py-0.5 text-xs font-semibold text-[#1B2A5A]">DEMO</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StudyCoachLoader canvas={canvas} />
      </main>
    </div>
  );
}
