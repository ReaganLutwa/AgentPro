import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/money";
import { toast } from "sonner";

export default function Team() {
  const utils = trpc.useUtils();
  const me = trpc.agency.me.useQuery();
  const members = trpc.team.members.useQuery(undefined, {
    enabled: !!me.data?.membership,
  });

  const checkIn = trpc.team.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Checked in for today");
      utils.team.members.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const currency = me.data?.membership?.agency.currency ?? "UGX";
  const isOwner = me.data?.membership?.role === "owner";
  const agency = me.data?.membership?.agency;
  const myRow = members.data?.find((m) => m.isYou);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Team</h1>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded">
                {agency?.inviteCode}
              </code>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(agency?.inviteCode ?? "");
                  toast.success("Copied");
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this code with your staff. They sign in, choose "Join an
              agency", and enter this code.
            </p>
          </CardContent>
        </Card>
      )}

      {myRow && !myRow.checkedInToday && (
        <Card>
          <CardContent className="pt-6">
            <Button
              className="w-full"
              disabled={checkIn.isPending}
              onClick={() => checkIn.mutate()}
            >
              ▶ Check in — start work day
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.data?.map((m) => (
            <div
              key={m.memberId}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  {m.name}
                  {m.isYou && <Badge variant="outline">You</Badge>}
                  <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                    {m.role}
                  </Badge>
                  {m.checkedInToday ? (
                    <Badge variant="outline" className="text-green-600">
                      ● Working today
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      ○ Not checked in
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Today: {m.todayTxns} txns ·{" "}
                  {fmtMoney(m.todayCommission, currency)} commission
                </div>
              </div>
              {isOwner && (
                <div className="text-right text-sm">
                  <div>
                    This month: <b>{m.monthTxns}</b> txns
                  </div>
                  <div>
                    Commission: <b>{fmtMoney(m.monthCommission, currency)}</b>
                  </div>
                </div>
              )}
            </div>
          ))}
          {members.data?.length === 0 && (
            <p className="text-muted-foreground">No members yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
