import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fmtMoney } from "@/lib/money";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const me = trpc.agency.me.useQuery();

  const membership = me.data?.membership;
  const isOwner = membership?.role === "owner";
  const currency = membership?.agency.currency ?? "UGX";
  const lines = membership?.lines ?? [];

  const [agencyName, setAgencyName] = useState("");
  const [cur, setCur] = useState("UGX");
  const [lineName, setLineName] = useState("");
  const [lineKind, setLineKind] = useState<"momo" | "bank">("momo");
  const [opening, setOpening] = useState("0");

  useEffect(() => {
    if (membership) {
      setAgencyName(membership.agency.name);
      setCur(membership.agency.currency);
    }
  }, [membership]);

  const updateSettings = trpc.agency.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.agency.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const addLine = trpc.agency.addLine.useMutation({
    onSuccess: () => {
      toast.success("Line added");
      setLineName("");
      setOpening("0");
      utils.agency.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLine = trpc.agency.deleteLine.useMutation({
    onSuccess: () => {
      toast.success("Line removed");
      utils.agency.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Agency name</Label>
            <Input
              value={agencyName}
              disabled={!isOwner}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Input
              value={cur}
              maxLength={5}
              disabled={!isOwner}
              onChange={(e) => setCur(e.target.value.toUpperCase())}
            />
          </div>
          {isOwner && (
            <Button
              disabled={updateSettings.isPending}
              onClick={() =>
                updateSettings.mutate({ name: agencyName, currency: cur })
              }
            >
              Save changes
            </Button>
          )}
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only the owner can change agency settings.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Money lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{l.name}</span>
                {l.kind === "bank" && <Badge variant="outline">🏦 Bank</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {fmtMoney(l.balance, currency)}
                </span>
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remove line "${l.name}"?`))
                        deleteLine.mutate({ lineId: l.id });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="border-t pt-4 space-y-3">
            <p className="font-medium">Add a line</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Centenary Bank Agent"
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={lineKind}
                  onValueChange={(v) => setLineKind(v as "momo" | "bank")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momo">📱 Mobile Money</SelectItem>
                    <SelectItem value="bank">🏦 Bank Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening float</Label>
                <Input
                  type="number"
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                />
              </div>
            </div>
            <Button
              disabled={addLine.isPending || lineName.trim().length < 2}
              onClick={() =>
                addLine.mutate({
                  name: lineName.trim(),
                  kind: lineKind,
                  openingBalance: Math.round(Number(opening) || 0),
                })
              }
            >
              Add line
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">{user?.name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <Button variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
