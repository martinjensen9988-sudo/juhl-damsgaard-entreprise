import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function KundeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.loginViaEmailPassword(email.trim(), password.trim());
      if (!["customer", "admin"].includes(result?.user?.role)) {
        await base44.auth.logout();
        setError("Denne adgang er ikke til kundeportalen.");
        return;
      }
      window.location.href = "/portal";
    } catch (err) {
      setError(err.message || "Forkert email eller adgangskode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Building2}
      title="Kundeportal"
      subtitle="Log ind for at se dine projekter, billeder, tilbud og fakturaer"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Medarbejder-login
        </Link>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="customer-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="din@email.dk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="customer-password">Adgangskode</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Glemt adgangskode?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="customer-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logger ind...
            </>
          ) : (
            "Log ind på kundeportal"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
