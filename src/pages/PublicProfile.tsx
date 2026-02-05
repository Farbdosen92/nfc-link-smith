import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Download, Send, Linkedin, Globe, User } from "lucide-react";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
  instagram?: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  job_title: string | null;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: SocialLinks | null;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Contact form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, [username]);

  async function fetchProfile(slug: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", slug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function generateVCard() {
    if (!profile) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name || profile.username}
ORG:${profile.company_name || ""}
TITLE:${profile.job_title || ""}
NOTE:${profile.bio || ""}
URL:${profile.social_links?.website || ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.username}.vcf`;
    link.click();
  }

  async function handleSendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      setSending(true);

      // Get chip ID for this user (if any)
      const { data: chip } = await supabase
        .from("nfc_chips")
        .select("id")
        .eq("assigned_to", profile.id)
        .limit(1)
        .maybeSingle();

      if (!chip) {
        toast({ title: "Fehler", description: "Kein aktiver Chip gefunden.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("leads").insert({
        chip_id: chip.id,
        name,
        email,
        phone,
        message,
      });

      if (error) throw error;

      toast({ title: "Gesendet!", description: "Ihre Nachricht wurde übermittelt." });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Profil nicht gefunden</h1>
          <p className="text-muted-foreground mt-2">Das gesuchte Profil existiert nicht: {username}</p>
        </div>
      </div>
    );
  }

  const links = profile?.social_links;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              <User size={48} />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 pb-8 px-4 text-center">
        <h1 className="text-3xl font-bold">{profile?.full_name || profile?.username}</h1>
        {profile?.job_title && (
          <p className="text-lg text-muted-foreground mt-1">
            {profile.job_title}
            {profile.company_name && ` @ ${profile.company_name}`}
          </p>
        )}
        {profile?.bio && <p className="text-muted-foreground mt-4 max-w-md mx-auto">{profile.bio}</p>}

        {/* Social Links */}
        <div className="flex justify-center gap-4 mt-6">
          {links?.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            >
              <Linkedin size={20} />
            </a>
          )}
          {links?.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            >
              <Globe size={20} />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 max-w-sm mx-auto">
          <Button onClick={generateVCard} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Kontakt speichern
          </Button>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-md mx-auto px-4 pb-12">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Kontaktieren Sie mich</h2>
          <form onSubmit={handleSendContact} className="space-y-4">
            <Input
              placeholder="Ihr Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Ihre E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="Ihre Telefonnummer (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Textarea
              placeholder="Ihre Nachricht..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Button type="submit" className="w-full" disabled={sending}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Wird gesendet..." : "Nachricht senden"}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
        <p>Powered by NFCwear</p>
      </footer>
    </div>
  );
}
