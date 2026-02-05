import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface NfcChip {
  id: string;
  chip_uid: string;
  active_mode: string;
  is_active: boolean;
  last_scanned_at: string | null;
  assigned_to: string | null;
  target_url: string | null;
}

export default function Devices() {
  const [devices, setDevices] = useState<NfcChip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChipUid, setNewChipUid] = useState("");
  const [newChipMode, setNewChipMode] = useState<string>("vcard");

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("nfc_chips")
        .select("*")
        .eq("assigned_to", user.id);

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddChip() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("nfc_chips").insert([{
        chip_uid: newChipUid,
        active_mode: newChipMode as "vcard" | "redirect" | "menu" | "review",
        assigned_to: user.id,
      }]);

      if (error) throw error;

      toast({ title: "Erfolg", description: "Chip wurde hinzugefügt." });
      setDialogOpen(false);
      setNewChipUid("");
      setNewChipMode("vcard");
      fetchDevices();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  }

  async function handleDeleteChip(id: string) {
    try {
      const { error } = await supabase.from("nfc_chips").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Erfolg", description: "Chip wurde gelöscht." });
      fetchDevices();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("nfc_chips")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      fetchDevices();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "vcard":
        return "border-primary text-primary";
      case "redirect":
        return "border-orange-500 text-orange-400";
      case "menu":
        return "border-green-500 text-green-400";
      case "review":
        return "border-purple-500 text-purple-400";
      default:
        return "border-muted-foreground text-muted-foreground";
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Geräte</h1>
          <p className="text-muted-foreground">Verwalten Sie alle NFC-Chips und deren aktive Modi.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Chip hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Chip hinzufügen</DialogTitle>
              <DialogDescription>
                Geben Sie die UID des NFC-Chips ein und wählen Sie den Modus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chip_uid">Chip UID</Label>
                <Input
                  id="chip_uid"
                  placeholder="z.B. A1B2C3D4"
                  value={newChipUid}
                  onChange={(e) => setNewChipUid(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Modus</Label>
                <Select value={newChipMode} onValueChange={setNewChipMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Modus wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vcard">vCard (Visitenkarte)</SelectItem>
                    <SelectItem value="redirect">Redirect (URL)</SelectItem>
                    <SelectItem value="menu">Menu (Speisekarte)</SelectItem>
                    <SelectItem value="review">Review (Bewertung)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddChip} disabled={!newChipUid}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead>UID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktiver Modus</TableHead>
              <TableHead>Letzter Scan</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-mono text-muted-foreground">
                  {device.chip_uid ? `****${device.chip_uid.slice(-4).toUpperCase()}` : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={device.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleToggleActive(device.id, device.is_active)}
                  >
                    {device.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getModeColor(device.active_mode)}>
                    {device.active_mode}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {device.last_scanned_at
                    ? new Date(device.last_scanned_at).toLocaleDateString("de-DE")
                    : "Nie"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteChip(device.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Keine Geräte gefunden. Fügen Sie eines hinzu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
