import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const t = useT();
  const nf = t.notFound || { title: "404", text: "Page not found", backHome: "Home" };

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{nf.title}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{nf.text}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">{nf.backHome}</a>
      </div>
    </div>
  );
};

export default NotFound;
