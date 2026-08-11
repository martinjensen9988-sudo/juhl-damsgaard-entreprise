import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Adgangskoderne er ikke ens");
      return;
    }
    if (newPassword.length < 8) {
      setError("Adgangskoden skal være mindst 8 tegn");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.changePassword({ currentPassword, newPassword });
      window.location.href = "/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "");
    } catch (err) {
      setError(err.message || "Adgangskoden kunne ikke ændres");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Lock}
      title="Vælg din adgangskode"
      subtitle="Du skal ændre den midlertidige adgangskode, før du kan bruge systemet"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Tilbage til log ind
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
          <Label htmlFor="current-password">Midlertidig adgangskode</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Ny adgangskode</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-12"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Gentag ny adgangskode</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gemmer...
            </>
          ) : (
            "Gem ny adgangskode"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
