import type { Metadata } from 'next';
import { getDemoSession } from '@/lib/demoSession';
import { getBannerData } from '@/lib/integrations/banner';
import { getCareerData } from '@/lib/integrations/career';
import { profileFromTwin } from '@/lib/connect/profile';
import { AppNav } from '@/components/AppNav';
import { ConnectLoader } from '@/components/connect/ConnectLoader';

export const metadata: Metadata = {
  title: 'Connect — FriarAI',
  description: 'Classmates and clubs matched to you, with a reason for every match.',
};

export default async function ConnectPage() {
  const session = getDemoSession();
  const [banner, career] = await Promise.all([
    getBannerData(session.user.studentId),
    getCareerData(session.user.studentId),
  ]);
  const defaultProfile = profileFromTwin(session.user.name ?? 'Student', banner.degreeAudit, career.profile);

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="connect" email={session.user.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ConnectLoader defaultProfile={defaultProfile} />
      </main>
    </div>
  );
}
