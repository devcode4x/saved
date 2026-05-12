import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setSessionId } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Shield, Sparkles } from "lucide-react";

interface Props { onConnected: () => void }

export default function Login({ onConnected }: Props) {
  const [step, setStep] = useState<"creds" | "code" | "password">("creds");
  const [loading, setLoading] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        api_id: Number(apiId),
        api_hash: apiHash.trim(),
        phone: phone.trim(),
      };
      if (password) payload.password = password;
      if (code) payload.code = code;
      if (phoneCodeHash) payload.phone_code_hash = phoneCodeHash;

      const { data } = await api.post("/api/login", payload);

      if (data.status === "code_required") {
        setPhoneCodeHash(data.phone_code_hash);
        setStep("code");
        toast.success("Code sent — check Telegram");
      } else if (data.status === "password_required") {
        if (data.session_id) setSessionId(data.session_id);
        setStep("password");
        toast.message("Two-factor password required");
      } else if (data.status === "ok") {
        setSessionId(data.session_id);
        toast.success("Connected to Telegram");
        onConnected();
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Telegram Saved Vault</CardTitle>
          <CardDescription>Your private cloud, powered by your own Saved Messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "creds" && (
            <>
              <Field label="API ID">
                <Input inputMode="numeric" placeholder="1234567" value={apiId} onChange={(e) => setApiId(e.target.value)} />
              </Field>
              <Field label="API Hash">
                <Input placeholder="abcdef0123..." value={apiHash} onChange={(e) => setApiHash(e.target.value)} />
              </Field>
              <Field label="Phone number">
                <Input placeholder="+15551234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="2FA password (optional)">
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Get your API_ID & API_HASH at <a className="underline" href="https://my.telegram.org" target="_blank" rel="noreferrer">my.telegram.org</a>. They never leave your backend.
              </p>
            </>
          )}
          {step === "code" && (
            <Field label="Login code (sent in Telegram)">
              <Input inputMode="numeric" placeholder="12345" value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
          )}
          {step === "password" && (
            <Field label="Two-factor password">
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          )}
          <Button onClick={submit} disabled={loading} size="lg" className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === "creds" ? "Connect to Telegram" : step === "code" ? "Verify code" : "Submit password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
