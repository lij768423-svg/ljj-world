type SceneLineOrnamentsProps = {
  variant: "about" | "projects" | "server";
};

export function SceneLineOrnaments({ variant }: SceneLineOrnamentsProps) {
  return (
    <div className={`scene-line-ornaments is-${variant}`} data-line-ornaments={variant} aria-hidden="true">
      <span className="scene-line-rail is-horizontal rail-a" />
      <span className="scene-line-rail is-horizontal rail-b" />
      <span className="scene-line-rail is-vertical rail-c" />
      <span className="scene-line-corner corner-a" />
      <span className="scene-line-corner corner-b" />
    </div>
  );
}
