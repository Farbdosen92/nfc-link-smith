import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ScanData {
  date: string;
  scans: number;
}

interface DeviceData {
  name: string;
  value: number;
}

interface Metrics {
  totalScans: number;
  uniqueVisitors: number;
  avgDaily: number;
  conversionRate: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function Analytics() {
  const [scanData, setScanData] = useState<ScanData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalScans: 0,
    uniqueVisitors: 0,
    avgDaily: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's chip IDs
      const { data: chips } = await supabase
        .from("nfc_chips")
        .select("id")
        .eq("assigned_to", user.id);

      const chipIds = chips?.map((c) => c.id) || [];

      if (chipIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch scans from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: scans } = await supabase
        .from("scan_analytics")
        .select("*")
        .in("chip_id", chipIds)
        .gte("scanned_at", thirtyDaysAgo.toISOString())
        .order("scanned_at", { ascending: true });

      const recentScans = scans || [];

      // Process metrics
      const totalScans = recentScans.length;
      const uniqueIps = new Set(recentScans.map((s) => String(s.ip_address))).size;
      const avgDaily = Math.round((totalScans / 30) * 10) / 10;

      // Get leads count
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("chip_id", chipIds);

      const conversionRate = totalScans > 0 ? Math.round(((leadsCount || 0) / totalScans) * 1000) / 10 : 0;

      setMetrics({ totalScans, uniqueVisitors: uniqueIps, avgDaily, conversionRate });

      // Process scan data by date
      const scansByDate: Record<string, number> = {};
      recentScans.forEach((scan) => {
        const date = new Date(scan.scanned_at).toLocaleDateString("de-DE", {
          month: "short",
          day: "numeric",
        });
        scansByDate[date] = (scansByDate[date] || 0) + 1;
      });

      setScanData(Object.entries(scansByDate).map(([date, count]) => ({ date, scans: count })));

      // Process device data
      const devices: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 };
      recentScans.forEach((scan) => {
        const type = scan.device_type || "Other";
        if (type.includes("Mobile")) devices.Mobile++;
        else if (type.includes("Desktop")) devices.Desktop++;
        else if (type.includes("Tablet")) devices.Tablet++;
        else devices.Other++;
      });

      setDeviceData(
        Object.entries(devices)
          .filter(([, val]) => val > 0)
          .map(([name, value]) => ({ name, value }))
      );
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance Ihrer NFC Chips (Letzte 30 Tage).</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground">Gesamt Scans</p>
          <p className="text-3xl font-bold mt-2">{metrics.totalScans}</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground">Unique Besucher</p>
          <p className="text-3xl font-bold mt-2">{metrics.uniqueVisitors}</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground">Ø pro Tag</p>
          <p className="text-3xl font-bold mt-2">{metrics.avgDaily}</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground">Konversionsrate</p>
          <p className="text-3xl font-bold mt-2">{metrics.conversionRate}%</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="font-semibold mb-4">Scans über Zeit</h3>
          <div className="h-[300px]">
            {scanData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scanData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="font-semibold mb-4">Geräteverteilung</h3>
          <div className="h-[300px]">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
