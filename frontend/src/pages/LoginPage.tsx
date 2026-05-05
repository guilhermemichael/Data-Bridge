import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";

export function LoginPage() {
  const { isAuthenticated, loginWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app";

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes("@") || password.length < 8) {
      setError("Use a valid email and a password with at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithPassword({ email, password });
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Invalid credentials or API unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Sign in to Data-Bridge"
      subtitle="Access your operational intelligence workspace."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        <button
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        New workspace?{" "}
        <Link className="text-cyan-200 hover:text-cyan-100" to="/register">
          Create an account
        </Link>
      </p>
    </AuthScreen>
  );
}

type FieldProps = {
  label: string;
  type: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
};

function Field({ label, type, value, autoComplete, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
        autoComplete={autoComplete}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bridge-bg px-5 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950/80 p-7 shadow-2xl shadow-black/30">
        <div className="mb-7">
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Data-Bridge
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
