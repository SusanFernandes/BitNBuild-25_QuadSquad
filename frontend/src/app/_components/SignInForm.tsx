// src/components/SignInForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "~/trpc/react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const SignInForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loginMutation = api.auth.login.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = loginSchema.safeParse(formData);
    if (!parseResult.success) {
      setMessage(parseResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await loginMutation.mutateAsync(formData);
      if (res.success) {
        document.cookie = `username=${res.user.name}; path=/; max-age=${60 * 60 * 24}`; // 1 day
        setMessage(`Welcome, ${res.user.name}!`);

        // Redirect to /stats page after successful login
        router.push("/stats");
      } else {
        setMessage(res.message);
      }
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      {message && (
        <p className={`text-center mt-2 ${loginMutation.isError ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

