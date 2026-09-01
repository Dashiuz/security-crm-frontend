import { redirect } from "next/navigation";

export default function RootPage() {
  // Common pattern: redirect to dashboard if session exists (handled by AuthProvider/Middleware)
  // or redirect to login. Since we have AuthProvider guarding routes,
  // redirecting to /dashboard is a safe default.
  redirect("/dashboard");
}
