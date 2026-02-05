import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function NfcRedirect() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (uid) {
      handleRedirect(uid);
    }
  }, [uid]);

  async function handleRedirect(chipUid: string) {
    try {
      // Fetch chip data
      const { data: chip, error } = await supabase
        .from("nfc_chips")
        .select("*, profiles:assigned_to(*)")
        .eq("chip_uid", chipUid)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !chip) {
        console.error("Chip not found:", error);
        return;
      }

      // Log the scan
      await supabase.from("scan_analytics").insert({
        chip_id: chip.id,
        device_type: getDeviceType(),
        user_agent: navigator.userAgent,
      });

      // Update last scanned
      await supabase
        .from("nfc_chips")
        .update({ last_scanned_at: new Date().toISOString() })
        .eq("id", chip.id);

      // Route based on mode
      switch (chip.active_mode) {
        case "vcard":
          if (chip.profiles?.username) {
            navigate(`/p/${chip.profiles.username}`);
          }
          break;
        case "redirect":
          if (chip.target_url) {
            window.location.href = chip.target_url;
          }
          break;
        case "menu":
          const menuData = chip.menu_data as { url?: string } | null;
          if (menuData?.url) {
            window.location.href = menuData.url;
          }
          break;
        case "review":
          const reviewData = chip.review_data as { url?: string } | null;
          if (reviewData?.url) {
            window.location.href = reviewData.url;
          }
          break;
        default:
          // Fallback to profile if available
          if (chip.profiles?.username) {
            navigate(`/p/${chip.profiles.username}`);
          }
      }
    } catch (error) {
      console.error("Error handling NFC redirect:", error);
    }
  }

  function getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return "Tablet";
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      return "Mobile";
    }
    return "Desktop";
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-foreground text-xl mb-2">Lädt...</div>
        <p className="text-muted-foreground text-sm">NFC-Tag wird verarbeitet</p>
        <p className="text-muted-foreground/50 text-xs mt-4">UID: {uid}</p>
      </div>
    </div>
  );
}
