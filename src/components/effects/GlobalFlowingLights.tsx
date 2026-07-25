const flowingLightRails = [
  { id: "top", axis: "horizontal", position: "top" },
  { id: "bottom", axis: "horizontal", position: "bottom" },
  { id: "left", axis: "vertical", position: "left" },
  { id: "right", axis: "vertical", position: "right" },
] as const;

export function GlobalFlowingLights({ deferred = false }: { deferred?: boolean }) {
  return (
    <div
      className={`global-flowing-lights${deferred ? " is-deferred" : ""}`}
      data-flowing-lights="global"
      aria-hidden="true"
    >
      {flowingLightRails.map((rail) => (
        <span
          key={rail.id}
          className={`global-flow-light-rail is-${rail.axis} is-${rail.position}`}
        >
          <span className="global-flow-light-runner" />
        </span>
      ))}
    </div>
  );
}
