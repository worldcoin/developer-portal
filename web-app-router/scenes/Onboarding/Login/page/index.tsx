import Link from "next/link";

export const LoginPage = () => (
  <div className="grid gap-y-4">
    <h1>Login</h1>

    <Link href="/api/auth/login">Press to Login</Link>
  </div>
);
