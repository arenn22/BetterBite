const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function getImageContentType(blobType: string, imageUri: string): string {
  if (blobType.toLowerCase().startsWith("image/")) return blobType;

  const cleanUri = imageUri.split(/[?#]/, 1)[0];
  const extension = cleanUri.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return (extension && MIME_TYPES_BY_EXTENSION[extension]) || "image/jpeg";
}

export function getImageFileExtension(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/heic": return "heic";
    case "image/heif": return "heif";
    case "image/avif": return "avif";
    default: return "jpg";
  }
}
