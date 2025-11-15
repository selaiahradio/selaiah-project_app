
import React, { useState } from "react";
import { sendMagicLink, redirectToGoogleLogin } from "@/lib/api"; // Using the new api.js

export default function Login() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleGoogleSignIn = () => {
    // Redirect to the current page after login.
    // The backend will append the access token.
    const redirectUrl = window.location.origin + window.location.pathname;
    redirectToGoogleLogin(redirectUrl);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFeedback("");

    try {
      const redirectUrl = window.location.origin + window.location.pathname.replace('/login','/');
      await sendMagicLink(email, redirectUrl);
      setFeedback("We've sent a magic link to your email. Please check your inbox!");
    } catch (err) {
      console.error("Magic link error:", err);
      setError(err.data?.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-xl">
        <div className="text-center">
            <h2 className="text-3xl font-bold">
                SELAIAH RADIO
            </h2>
            <p className="text-gray-400">Donde el cielo toca la tierra</p>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Sign in with Google
        </button>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">OR CONTINUE WITH</span>
            </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Sending Link..."
                : "Send Magic Link"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-center text-red-400">{error}</p>
          )}
          {feedback && (
            <p className="mt-2 text-sm text-center text-green-400">{feedback}</p>
          )}
        </form>
      </div>
    </div>
  );
}
