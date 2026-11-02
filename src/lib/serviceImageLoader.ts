import { serviceArtImages } from "../assets/serviceArt";

const pendingImages = new Map<string, Promise<void>>();
// Holding the element keeps the image in the browser's memory cache. Once it is garbage collected,
// the <image> that shows the artwork may have to fetch it again.
const loadedImages = new Map<string, HTMLImageElement>();

export function loadServiceImage(source: string): Promise<void> {
  const existing = pendingImages.get(source);
  if (existing) return existing;
  const image = new Image();
  image.decoding = "async";
  const promise = new Promise<void>((resolve, reject) => {
    image.onload = () => {
      image.decode().then(resolve, reject);
    };
    image.onerror = () => reject(new Error("Service image could not load"));
    image.src = source;
  }).then(() => {
    loadedImages.set(source, image);
  }, error => {
    pendingImages.delete(source);
    throw error;
  });
  pendingImages.set(source, promise);
  return promise;
}

export function prefetchServiceImage(serviceId: string) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")) return;
  const source = serviceArtImages[serviceId];
  if (source) void loadServiceImage(source).catch(() => undefined);
}

export function prefetchServiceImages(serviceIds: readonly string[]) {
  for (const serviceId of serviceIds) prefetchServiceImage(serviceId);
}
