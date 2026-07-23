import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("UGX");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const create = trpc.agency.create.useMutation({
    onSuccess: onDone,
    onError: (e) => setError(e.message),
  });
  const join = trpc.agency.join.useMutation({
    onSuccess: onDone,
    onError: (e) => setError(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">💼 Welcome to AgentPro</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Set up your agency — or join your boss's team with an invite code.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "create" ? "default" : "outline"} className="flex-1"
              onClick={() => setMode("create")}>Create agency</Button>
            <Button variant={mode === "join" ? "default" : "outline"} className="flex-1"
              onClick={() => setMode("join")}>Join team</Button>
          </div>

          {mode === "create" ? (
            <>
              <Input placeholder="Agency name (e.g. Lutwama Money Point)"
                value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Currency</span>
                <Input className="w-24" value={currency} maxLength={5}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
              </div>
              <Button className="w-full" disabled={name.trim().length < 2 || create.isPending}
                onClick={() => create.mutate({ name: name.trim(), currency })}>
                {create.isPending ? "Creating…" : "Create my agency"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Starts you with MTN MoMo, Airtel Money and Mobile Banking lines — editable anytime.
              </p>
            </>
          ) : (
            <>
              <Input placeholder="Invite code (e.g. K7M2P9)" value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
              <Button className="w-full" disabled={code.trim().length < 4 || join.isPending}
                onClick={() => join.mutate({ inviteCode: code.trim() })}>
                {join.isPending ? "Joining…" : "Join team"}
              </Button>
            </>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
