import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, ScanLine, ArrowUpRight, DollarSign } from "lucide-react";

interface Stats {
  scansCount: number;
  leadsCount: number;
  chipsCount: number;
}

interface Scan {
  id: string;
  device_type: string | null;
  scanned_at: string;
  ip_address: unknown;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ scansCount: 0, leadsCount: 0, chipsCount: 0 });
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get chips assigned to user
        const { data: chips } = await supabase
          .from("nfc_chips")
          .select("id")
          .eq("assigned_to", user.id);

        const chipIds = chips?.map((c) => c.id) || [];

        // Get scans count
        const { count: scansCount } = await supabase
          .from("scan_analytics")
          .select("*", { count: "exact", head: true })
          .in("chip_id", chipIds.length > 0 ? chipIds : ["no-chips"]);

        // Get leads count
        const { count: leadsCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("chip_id", chipIds.length > 0 ? chipIds : ["no-chips"]);

        // Get recent scans
        const { data: scans } = await supabase
          .from("scan_analytics")
          .select("*")
          .in("chip_id", chipIds.length > 0 ? chipIds : ["no-chips"])
          .order("scanned_at", { ascending: false })
          .limit(5);

        setStats({
          scansCount: scansCount || 0,
          leadsCount: leadsCount || 0,
          chipsCount: chipIds.length,
        });
        setRecentScans(scans || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Gesamt Scans" value={stats.scansCount} change="Gesamtzeit" icon={ScanLine} />
        <StatsCard title="Aktive Kontakte" value={stats.leadsCount} change="Erfasste Kontakte" icon={Users} />
        <StatsCard title="Aktive Chips" value={stats.chipsCount} change="Verteilte Geräte" icon={ArrowUpRight} />
        <StatsCard title="Umsatz" value="0€" change="Platzhalter" icon={DollarSign} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border p-6 h-[400px]">
          <h3 className="font-semibold mb-4">Live Scan Feed</h3>
          <div className="text-muted-foreground text-sm">
            <div className="space-y-4 mt-4">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ScanLine size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{scan.device_type || "Unknown Device"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.scanned_at).toLocaleTimeString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{String(scan.ip_address || "")}</span>
                </div>
              ))}
              {recentScans.length === 0 && <p>Noch keine Scans.</p>}
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Performance (30 Tage)</h3>
            <Link to="/dashboard/analytics" className="text-xs text-primary hover:underline">
              Details
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="text-center">
              <h4 className="text-4xl font-bold text-foreground mb-1">{stats.scansCount}</h4>
              <p className="text-muted-foreground text-sm">Scans Gesamt</p>
            </div>
            <div className="w-full bg-muted h-32 rounded-lg flex items-end px-4 gap-2 pb-2">
              {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/50 transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Mini-Preview. Für Details siehe Analytics.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, change, icon: Icon }: any) {
  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold mt-2">{value}</h2>
        </div>
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">{change}</p>
    </Card>
  );
}
