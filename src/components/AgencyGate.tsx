import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import Onboarding from "@/pages/Onboarding";

/** Wraps a page: loads membership, shows Onboarding if the user has no agency. */
export default function AgencyGate({ children }: { children: React.ReactNode }) {
  const me = trpc.agency.me.useQuery(undefined, { retry: false });

  if (me.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!me.data?.membership) {
    return <Onboarding onDone={() => me.refetch()} />;
  }
  return <AuthLayout>{children}</AuthLayout>;
}
