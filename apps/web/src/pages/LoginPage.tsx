import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { ApiError } from '../lib/api-client';
import { useAuth, type LoginCredentials } from '../lib/auth';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const state = location.state as LocationState | null;
  const from = state?.from?.pathname || '/tickets';

  const onSubmit = async (values: LoginCredentials) => {
    setServerError(null);
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Unable to sign in. Please verify your credentials.');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
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
            <Input
              id="email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              loadingText="Signing in..."
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
