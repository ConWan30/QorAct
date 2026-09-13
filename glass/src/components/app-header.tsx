export function AppHeader() {
  return (
    <header className="border-b border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Authorship plane · CANDIDATE v0.2
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-[-0.04em] text-foreground sm:text-4xl">
            QorAct
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground text-pretty">
            Who made this act — the gamer, a bot, both, or we do not know. Not
            anti-cheat. Not observation. Not a humanity proof.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="rounded-sm border border-border px-2 py-1 text-primary">
            live:false
          </span>
          <span className="rounded-sm border border-border px-2 py-1 text-accent">
            chain paused
          </span>
          <span className="rounded-sm border border-border px-2 py-1 text-muted-foreground">
            no frozen
          </span>
        </div>
      </div>
    </header>
  );
}
