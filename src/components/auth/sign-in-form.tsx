"use client";

import { FormEvent, useMemo, useState } from "react";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getClerkErrorMessage(error: unknown) {
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? "ログインに失敗しました。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "ログインに失敗しました。入力内容を確認してください。";
}

function normalizeRedirectUrl(value: string | null) {
  if (!value) {
    return "/dashboard";
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}${url.hash}` || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

async function activateCompletedSession(
  sessionId: string | null,
  setActive: NonNullable<ReturnType<typeof useSignIn>["setActive"]>,
  redirectUrl: string,
  router: ReturnType<typeof useRouter>,
) {
  if (!sessionId) {
    return false;
  }

  await setActive({ session: sessionId });
  router.push(redirectUrl);
  router.refresh();
  return true;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = useMemo(
    () => normalizeRedirectUrl(searchParams.get("redirect_url")),
    [searchParams],
  );

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signIn || !setActive) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const createdSignIn = await signIn.create({ identifier });

      if (
        createdSignIn.status === "complete" &&
        await activateCompletedSession(createdSignIn.createdSessionId, setActive, redirectUrl, router)
      ) {
        return;
      }

      const passwordFactor = createdSignIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "password",
      );

      if (createdSignIn.status === "needs_first_factor" && passwordFactor) {
        const passwordAttempt = await createdSignIn.attemptFirstFactor({
          strategy: "password",
          password,
        });

        if (
          passwordAttempt.status === "complete" &&
          await activateCompletedSession(passwordAttempt.createdSessionId, setActive, redirectUrl, router)
        ) {
          return;
        }

        if (passwordAttempt.status === "needs_second_factor") {
          setError("2段階認証が必要です。現在のログイン画面は2段階認証にまだ対応していません。");
          return;
        }
      }

      setError("メール/パスワードでログインできませんでした。Clerk側でパスワード認証が有効か確認してください。");
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fc] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center bg-white px-5 shadow-2xl shadow-slate-200/80 sm:px-8">
        <section className="w-full max-w-md">
          <div className="mb-9 text-center">
            <h1 className="text-5xl font-semibold tracking-normal text-blue-600">Login</h1>
            <p className="mt-4 text-sm text-slate-600">
              登録済みのアカウントでログインしてください
            </p>
          </div>

          <form className="space-y-5" onSubmit={handlePasswordSignIn}>
            <div>
              <Label htmlFor="identifier" className="sr-only">
                ユーザー名またはメールアドレス
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="h-16 rounded-2xl border-slate-200 pl-14 text-base shadow-sm shadow-slate-100 placeholder:text-slate-400"
                  placeholder="Enter your username/email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="sr-only">
                パスワード
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-16 rounded-2xl border-slate-200 pl-14 text-base shadow-sm shadow-slate-100 placeholder:text-slate-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-16 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              disabled={!isLoaded || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
