import { useLocation, Link } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted-foreground">
        No page exists at <span className="font-mono">{location.pathname}</span>
      </p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Back to DiscoveryVoice
      </Link>
    </div>
  );
}
