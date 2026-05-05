import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { AuthScreen } from "./LoginPage";
import { useAuth } from "../features/auth/AuthContext";

export function RegisterPage() {
  const { isAuthenticated, registerAccount } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.includes("@") || password.length < 8) {
      setError("Fill name, valid email and a password with at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await registerAccount({
        full_name: fullName,
        email,
        password,
        organization_name: organizationName || undefined,
      });
      navigate("/app", { replace: true });
    } catch {
      setError("Could not create account. Check the data or API connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Create a Data-Bridge workspace"
      subtitle="Register and start importing operational datasets."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="Full name" value={fullName} onChange={setFullName} />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <Input
          label="Organization"
          value={organizationName}
          onChange={setOrganizationName}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
        />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        <button
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating workspace..." : "Create workspace"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Already have access?{" "}
        <Link className="text-cyan-200 hover:text-cyan-100" to="/login">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}

type InputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

function Input({ label, type = "text", value, onChange }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
