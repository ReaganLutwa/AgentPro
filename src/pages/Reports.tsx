import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/money";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const me = trpc.agency.me.useQuery();
  const members = trpc.team.members.useQuery(undefined, {
    enabled: !!me.data?.membership,
  });

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );
  const [fromStr, setFromStr] = useState(iso(monthStart));
  const [toStr, setToStr] = useState(iso(today));

  const from = useMemo(() => new Date(fromStr + "T00:00:00"), [fromStr]);
  const to = useMemo(() => new Date(toStr + "T23:59:59"), [toStr]);

  const summary = trpc.report.summary.useQuery(
    { from, to },
    { enabled: !!me.data?.membership && !isNaN(from.getTime()) && !isNaN(to.getTime()) },
  );

  const currency = me.data?.membership?.agency.currency ?? "UGX";
  const lines = me.data?.membership?.lines ?? [];
  const memberName = useMemo(() => {
    const map = new Map<number, string>();
    members.data?.forEach((m) => map.set(m.memberId, m.name));
    return map;
  }, [members.data]);

  const s = summary.data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
          <div>
            <Label>From</Label>
            <Input
              type="date"
              value={fromStr}
              onChange={(e) => setFromStr(e.target.value)}
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type="date"
              value={toStr}
              onChange={(e) => setToStr(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {s?.totalTxns ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {s ? fmtMoney(s.totalVolume, currency) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Commission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {s ? fmtMoney(s.totalCommission, currency) : "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By team member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {s &&
            Object.entries(s.byMember).map(([mid, v]) => (
              <div
                key={mid}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="font-medium">
                  {memberName.get(Number(mid)) ?? `Member #${mid}`}
                </div>
                <div className="text-sm text-right">
                  <div>
                    {v.count} txns · {fmtMoney(v.volume, currency)}
                  </div>
                  <div className="text-green-600 font-medium">
                    {fmtMoney(v.commission, currency)} commission
                  </div>
                </div>
              </div>
            ))}
          {s && Object.keys(s.byMember).length === 0 && (
            <p className="text-muted-foreground">
              No transactions in this period.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By money line</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {s &&
            Object.entries(s.byLine).map(([lid, v]) => {
              const line = lines.find((l) => l.id === Number(lid));
              return (
                <div
                  key={lid}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="font-medium flex items-center gap-2">
                    {line?.name ?? `Line #${lid}`}
                    {line?.kind === "bank" && (
                      <Badge variant="outline">🏦 Bank</Badge>
                    )}
                  </div>
                  <div className="text-sm text-right">
                    <div>
                      {v.count} txns · {fmtMoney(v.volume, currency)}
                    </div>
                    <div className="text-green-600 font-medium">
                      {fmtMoney(v.commission, currency)} commission
                    </div>
                  </div>
                </div>
              );
            })}
          {s && Object.keys(s.byLine).length === 0 && (
            <p className="text-muted-foreground">
              No transactions in this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
