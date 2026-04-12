export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Client Starter
        </h1>
        <p className="mt-4 text-lg text-foreground/70">
          Your project is ready. Start building in{" "}
          <code className="rounded bg-foreground/10 px-2 py-1 font-mono text-sm">
            apps/web/src/app/page.tsx
          </code>
        </p>
      </div>
    </main>
  );
}
