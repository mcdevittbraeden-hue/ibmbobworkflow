import type { Metadata } from 'next';
import { getDemoSession } from '@/lib/demoSession';
import { AppNav } from '@/components/AppNav';
import { RelayApp } from '@/components/relay/RelayApp';

export const metadata: Metadata = {
  title: 'Relay — FriarAI',
  description: 'Describe a campus problem; Relay finds who can fix it, sends one message and tracks the case.',
};

export default function RelayPage() {
  const session = getDemoSession();
  return (
    <div className="min-h-screen bg-white">
      <AppNav active="relay" email={session.user.email} />
      <RelayApp />
    </div>
  );
}
