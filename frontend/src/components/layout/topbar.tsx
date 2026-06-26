export function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <div className="text-sm font-medium text-neutral-300">
            ForgeOps Control Plane
          </div>
          <div className="text-xs text-neutral-500">
            Developer-first deployments and runtime control
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300">
          Local Dev
        </div>
      </div>
    </header>
  );
}