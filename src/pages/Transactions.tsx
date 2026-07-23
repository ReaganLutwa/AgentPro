import { useState } from "react";
import AgencyGate from "@/components/AgencyGate";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtMoney, TXN_TYPES, TXN_LABEL } from "@/lib/money";

function TransactionsInner() {
  const me = trpc.agency.me.useQuery();
  const utils = trpc.useUtils();
  const [lineFilter, setLineFilter] = useState<number | undefined>(undefined);
  const list = trpc.txn.list.useQuery({ lineId: lineFilter });
  const add = trpc.txn.add.useMutation({
    onSuccess: () => {
      utils.txn.list.invalidate();
      utils.agency.me.invalidate();
      setAmount(""); setCommission(""); setNote("");
    },
  });

  const [type, setType] = useState<string>("WITHDRAWAL");
  const [lineId, setLineId] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [commission, setCommission] = useState("");
  const [note, setNote] = useState("");

  if (me.isLoading || !me.data?.membership) return null;
  const { agency } = me.data.membership;
  const lines = me.data.membership.lines;
  const activeLine = lineId ?? lines[0]?.id;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <Card>
        <CardHeader><CardTitle>+ Add transaction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <select className="border rounded-md p-2 bg-background" value={type}
              onChange={(e) => setType(e.target.value)}>
              {TXN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="border rounded-md p-2 bg-background"
              value={activeLine} onChange={(e) => setLineId(Number(e.target.value))}>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.kind === "bank" ? " 🏦" : ""}</option>
              ))}
            </select>
            <Input placeholder="Amount" inputMode="numeric" value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
            <Input placeholder="Commission earned" inputMode="numeric" value={commission}
              onChange={(e) => setCommission(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button className="w-full" disabled={!amount || add.isPending}
            onClick={() => add.mutate({
              lineId: activeLine!, type: type as never,
              amount: Number(amount), commission: Number(commission || 0), note,
            })}>
            {add.isPending ? "Saving…" : "Save transaction"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={lineFilter === undefined ? "default" : "outline"}
          onClick={() => setLineFilter(undefined)}>All lines</Button>
        {lines.map((l) => (
          <Button key={l.id} size="sm" variant={lineFilter === l.id ? "default" : "outline"}
            onClick={() => setLineFilter(l.id)}>
            {l.name}{l.kind === "bank" ? " 🏦" : ""}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-2">
          {(list.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          )}
          {(list.data ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <span className="font-medium">{TXN_LABEL[t.type]}</span>
                <span className="text-muted-foreground"> · {t.memberName} · </span>
                <span className="text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                {t.commission > 0 && (
                  <Badge variant="secondary" className="ml-2">+{fmtMoney(t.commission, agency.currency)}</Badge>
                )}
                {t.note && <div className="text-xs text-muted-foreground">{t.note}</div>}
              </div>
              <span className="font-semibold">{fmtMoney(t.amount, agency.currency)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Transactions() {
  return <AgencyGate><TransactionsInner /></AgencyGate>;
}
