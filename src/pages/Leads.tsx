import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Mail, Phone, MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
  chip_id: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
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
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("chip_id", chipIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ["Name", "Email", "Telefon", "Nachricht", "Datum"];
    const rows = leads.map((lead) => [
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.message || "",
      new Date(lead.created_at).toLocaleDateString("de-DE"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontakte</h1>
          <p className="text-muted-foreground">
            Alle über Ihre NFC-Chips erfassten Kontakte.
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={leads.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          CSV Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mit E-Mail</p>
              <p className="text-2xl font-bold">{leads.filter((l) => l.email).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mit Telefon</p>
              <p className="text-2xl font-bold">{leads.filter((l) => l.phone).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mit Nachricht</p>
              <p className="text-2xl font-bold">{leads.filter((l) => l.message).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Nachricht</TableHead>
              <TableHead>Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium">{lead.name || "-"}</TableCell>
                <TableCell>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                      {lead.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {lead.message || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString("de-DE")}
                </TableCell>
              </TableRow>
            ))}

            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Noch keine Kontakte erfasst.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
