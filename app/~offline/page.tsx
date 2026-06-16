export default function OfflineFallbackPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold tracking-tight">Offline</h1>
      <p className="mt-4 text-muted-foreground">
        It looks like you don't have an internet connection. Please check your network and try again.
      </p>
    </div>
  );
}
