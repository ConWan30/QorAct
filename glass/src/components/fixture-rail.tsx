import { FIXTURES } from "@/lib/qoract";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export function FixtureRail() {
  const fixtureId = useWorkspace((s) => s.fixtureId);
  const loadFixture = useWorkspace((s) => s.loadFixture);
  const issuing = useWorkspace((s) => s.issuing);

  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Contract fixtures
      </p>
      <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
        {FIXTURES.map((fx) => {
          const on = fixtureId === fx.id;
          return (
            <button
              key={fx.id}
              type="button"
              disabled={issuing}
              onClick={() => void loadFixture(fx.id)}
              className={cn(
                "shrink-0 rounded-md border px-3 py-2 text-left transition-colors duration-[var(--motion-quick)]",
                on
                  ? "border-foreground/30 bg-card text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
            >
              <span className="block font-mono text-[11px] tracking-[0.04em]">
                {fx.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
