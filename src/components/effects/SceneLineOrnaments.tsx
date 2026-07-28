type SceneLineOrnamentsProps = {
  variant: "about" | "projects" | "server" | "desk";
};

export function SceneLineOrnaments({ variant }: SceneLineOrnamentsProps) {
  const hasExpandedField = variant === "desk";

  return (
    <div className={`scene-line-ornaments is-${variant}`} data-line-ornaments={variant} aria-hidden="true">
      <span className="scene-line-rail is-horizontal rail-a" />
      <span className="scene-line-rail is-horizontal rail-b" />
      <span className="scene-line-rail is-vertical rail-c" />
      {hasExpandedField ? <span className="scene-line-rail is-horizontal rail-d" /> : null}
      {hasExpandedField ? <span className="scene-line-rail is-vertical rail-e" /> : null}
      <span className="scene-line-corner corner-a" />
      <span className="scene-line-corner corner-b" />
      {hasExpandedField ? <span className="scene-line-corner corner-c" /> : null}
    </div>
  );
}
