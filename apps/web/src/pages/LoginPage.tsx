import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
}

/**
 * Accessible SupportDesk login screen with React Hook Form validation,
 * double-submit protection, and Navy + Teal visual hierarchy.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname || '/tickets';

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#172B4D] text-lg font-bold text-white shadow-sm">
            <span className="text-[#0D9488]">S</span>D
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#172B4D]">
            Sign in to SupportDesk
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Access your team&apos;s customer support queue and ticket workspace.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
          {serverError ? (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#334155]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="you@company.com"
                className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email ? (
                <p id="email-error" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#334155]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                placeholder="Enter your password"
                className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              {errors.password ? (
                <p id="password-error" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

