import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[18px] bg-ink mb-5">
            <span className="text-white text-2xl font-black">F</span>
          </div>
          <h1 className="page-title">FriarAI</h1>
          <p className="text-muted text-sm mt-1">Providence College Student Success</p>
        </div>

        {/* Sign in card */}
        <div className="card p-7">
          <h2 className="card-title mb-1">Welcome back, Friar!</h2>
          <p className="text-muted text-sm mb-6">
            Sign in with your Providence College account to access your personalized academic dashboard.
          </p>

          <form
            action={async () => {
              'use server';
              await signIn('microsoft-entra-id', { redirectTo: '/dashboard' });
            }}
          >
            <button type="submit" className="btn-primary w-full py-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Sign in with Providence College
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-4">
            Use your @providence.edu Microsoft account
          </p>
        </div>

        <p className="text-muted text-xs text-center mt-6">
          By signing in, you authorize FriarAI to access your Canvas courses,<br />
          academic records, and calendar to personalize your experience.
        </p>
      </div>
    </div>
  );
}
