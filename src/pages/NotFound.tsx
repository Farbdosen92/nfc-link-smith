import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Seite nicht gefunden</h2>
          <p className="text-muted-foreground max-w-md">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Zur Startseite
          </Link>
        </Button>
      </div>
    </div>
  );
}
