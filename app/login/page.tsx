import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1B2A5A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white mb-4">
            <span className="text-[#1B2A5A] text-3xl font-black">F</span>
          </div>
          <h1 className="text-white text-2xl font-bold">FriarAI</h1>
          <p className="text-blue-200 text-sm mt-1">Providence College Student Success</p>
        </div>

        {/* Sign in card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-gray-900 font-semibold text-lg mb-1">Welcome back, Friar!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Sign in with your Providence College account to access your personalized academic dashboard.
          </p>

          <form
            action={async () => {
              'use server';
              await signIn('microsoft-entra-id', { redirectTo: '/dashboard' });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1B2A5A] px-4 py-3 text-white font-semibold text-sm hover:bg-[#243672] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Sign in with Providence College
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Use your @providence.edu Microsoft account
          </p>
        </div>

        <p className="text-blue-300 text-xs text-center mt-6">
          By signing in, you authorize FriarAI to access your Canvas courses,<br />
          academic records, and calendar to personalize your experience.
        </p>
      </div>
    </div>
  );
}
