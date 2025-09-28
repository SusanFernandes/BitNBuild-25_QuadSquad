// src/app/signin/page.tsx
import { SignInForm } from "./_components/SignInForm";
import { HydrateClient } from "~/trpc/server";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInForm />
    </main>
  );
}

