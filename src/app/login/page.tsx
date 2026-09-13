import Image from "next/image";
import Link from "next/link";
import { studio } from "@/lib/studio";
import { adminLogin } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const { next = "/", error, reset } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('/brand/login-bg.jpg')] bg-cover bg-center px-6">
      {/* A tint over the photo, not the photo itself, sits behind the mark —
          the identity guidelines only allow the logo on solid black/white/
          transparent, never a busy image. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />

      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--paper)] p-8 shadow-2xl">
        <Image
          src="/brand/srs-logo.png"
          alt={studio.name}
          width={1488}
          height={366}
          unoptimized
          priority
          className="mb-8 h-9 w-auto"
        />
        <p className="font-sans-ui mb-6 flex items-center gap-2 text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          SRS Catalogue Hub
        </p>
        {reset === "success" && (
          <p className="font-sans-ui mb-4 rounded-lg bg-[var(--footer-bg)] px-4 py-3 text-sm text-[var(--ink)]">
            Password updated — log in with your new password.
          </p>
        )}
        <form action={adminLogin} className="w-full">
          <input type="hidden" name="next" value={next} />
          <label
            htmlFor="password"
            className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoFocus
            className="font-sans-ui mb-4 w-full rounded-lg border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
          />
          {error && (
            <p className="font-sans-ui mb-4 text-sm text-red-800">
              Incorrect password — please try again.
            </p>
          )}
          <button
            type="submit"
            className="font-sans-ui w-full rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
          >
            Enter
          </button>
        </form>
        <Link
          href="/forgot-password"
          className="font-sans-ui mt-5 block text-center text-xs text-[var(--ink)]/50 hover:text-[var(--ink)]"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
