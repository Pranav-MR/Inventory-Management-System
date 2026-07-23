const APP_VERSION = '1.0.0';

export function AboutSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl [background:linear-gradient(135deg,#4ade80,#3b82f6)]">
          <span className="text-lg font-bold text-white">◆</span>
        </div>
        <div>
          <h3 className="font-heading text-base font-bold">Inventory</h3>
          <p className="text-muted-foreground text-xs">Version {APP_VERSION}</p>
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        A consumable inventory management app for tracking batches and expiry dates, projecting
        stock forward from real consumption rates, and getting timely recommendations on when to
        reorder — so nothing runs out and nothing goes to waste.
      </p>

      <div className="border-border flex flex-col gap-1 border-t pt-4 text-sm">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Developer</span>
        <span>Pranav M R</span>
      </div>
    </div>
  );
}
