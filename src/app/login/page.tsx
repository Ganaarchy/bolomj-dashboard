"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, redirectByRole, setStoredUser, setToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((user) => {
        setStoredUser(user);
        redirectByRole(user.role);
      })
      .catch(() => {
        window.localStorage.clear();
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.login({ email, password });

      const token =
        response.accessToken ??
        response.token ??
        response.access_token ??
        response.jwt;

      if (!token) {
        console.log("LOGIN RESPONSE:", response);
        throw new Error("JWT token response дотор олдсонгүй.");
      }

      setToken(token);

      const user = response.user ?? (await api.me());
      setStoredUser(user);
      redirectByRole(user.role);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { 
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">Нэвтрэх</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Bolomj dashboard руу эрхээрээ нэвтэрнэ үү.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
