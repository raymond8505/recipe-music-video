import { Agent } from "undici";
import path from "path";
export async function longLivedFetch(url, options = {}) {
  const longTimeoutAgent = new Agent({
    connectTimeout: 600000, // 10 minutes for connection
    headersTimeout: 600000, // 10 minutes for headers
    bodyTimeout: 600000, // 10 minutes for body
  });

  const webhookResponse = await fetch(url, {
    ...options,
    dispatcher: longTimeoutAgent,
  });

  if (!webhookResponse.ok) {
    throw new Error(`Webhook failed: ${webhookResponse.status}`);
  }

  const result = await webhookResponse.json();
  console.log("✓ Received workflow response\n");

  return result;
}

/**
 * Sanitizes strings for filenames and normalizes slashes for FFmpeg/Windows.
 * @param {string} inputPath - The string or path to clean.
 * @returns {string} - A path with forward slashes and no illegal characters.
 */
export function sanitizePath(inputPath) {
  const isWindows = process.platform === "win32";

  // 1. Resolve to absolute path
  let normalized = path.resolve(inputPath);

  if (isWindows) {
    // 2. Separate the drive letter (e.g., C:) from the rest of the path
    const { root, dir, base, ext } = path.parse(normalized);

    // 3. Sanitize only the filename/folders, not the drive root
    const cleanBase = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
    const cleanDir = dir.replace(root, "").replace(/[<>:"|?*\x00-\x1F]/g, "_");

    // 4. Reconstruct and force forward slashes
    normalized = path.join(root, cleanDir, cleanBase);
  }

  return normalized.replace(/\\/g, "/");
}
