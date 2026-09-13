// Client-side counterpart to src/lib/r2.ts's presigned-PUT flow, replacing
// @vercel/blob/client's upload(). fetch() has no upload-progress event, so
// the actual PUT goes through XMLHttpRequest to keep the progress bar this
// app already had.
export function uploadToR2(
  pathname: string,
  file: Blob,
  options: { contentType: string; onUploadProgress?: (progress: { percentage: number }) => void },
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    fetch("/api/brochures/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname, contentType: options.contentType }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}) as { error?: string });
          throw new Error(body.error ?? "Failed to prepare upload.");
        }
        const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", options.contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            options.onUploadProgress?.({ percentage: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ url: publicUrl });
          } else {
            reject(new Error(`Upload failed (${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed — network error."));
        xhr.send(file);
      })
      .catch((err) => reject(err instanceof Error ? err : new Error("Upload failed.")));
  });
}
