import AgencyGate from "@/components/AgencyGate";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney, TXN_LABEL } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

function DashboardInner() {
  const me = trpc.agency.me.useQuery();
  const utils = trpc.useUtils();
  const todayTxns = trpc.txn.list.useQuery({ todayOnly: true });
  const checkIn = trpc.team.checkIn.useMutation({
    onSuccess: () => utils.team.members.invalidate(),
  });
  const members = trpc.team.members.useQuery();

  if (me.isLoading || !me.data?.membership) return null;
  const { agency, role } = me.data.membership;
  const lines = me.data.membership.lines;
  const txns = todayTxns.data ?? [];
  const volume = txns.reduce((s, t) => s + (t.type === "ADJUSTMENT" ? 0 : Math.abs(t.amount)), 0);
  const commission = txns.reduce((s, t) => s + t.commission, 0);
  const services = txns.filter((t) => t.type === "AIRTIME").length;
  const myMember = members.data?.find((mm) => mm.isYou);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{agency.name}</h1>
          <p className="text-sm text-muted-foreground">
            {role === "owner" ? "👑 Owner" : "Team member"} · {agency.currency}
          </p>
        </div>
        {myMember?.checkedInToday ? (
          <Badge variant="secondary" className="text-sm py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Checked in
          </Badge>
        ) : (
          <Button onClick={() => checkIn.mutate()} disabled={checkIn.isPending}>
            ▶ Start work day
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-2xl font-bold">{txns.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-2xl font-bold">{fmtMoney(volume, agency.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Commission</p>
          <p className="text-2xl font-bold text-green-600">{fmtMoney(commission, agency.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Services</p>
          <p className="text-2xl font-bold">{services}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Float balances</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                <span>{l.name}</span>
                {l.kind === "bank" && <Badge variant="outline">🏦 Bank</Badge>}
              </div>
              <span className="font-semibold">{fmtMoney(l.balance, agency.currency)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent today</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {txns.length === 0 && (
            <p className="text-sm text-muted-foreground">No transactions yet today.</p>
          )}
          {txns.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <span className="font-medium">{TXN_LABEL[t.type]}</span>
                <span className="text-muted-foreground"> · {t.memberName}</span>
              </div>
              <span className="font-semibold">{fmtMoney(t.amount, agency.currency)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return <AgencyGate><DashboardInner /></AgencyGate>;
}
