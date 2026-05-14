import type { AuditResult } from "@/types/metrics";
import type { Suggestion } from "@/lib/suggestions-engine";

export interface ShareableReport {
  result: AuditResult;
  suggestions: Suggestion[];
}

const MAX_COMPRESSED_BYTES = 512 * 1024;
const MAX_DECOMPRESSED_BYTES = 2 * 1024 * 1024;

export async function encodeReport(report: ShareableReport): Promise<string> {
  const json = JSON.stringify(report);
  const bytes = new TextEncoder().encode(json);

  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const compressed = await new Response(cs.readable).arrayBuffer();
  const uint8 = new Uint8Array(compressed);

  let binary = "";
  for (const byte of uint8) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function decodeReport(
  encoded: string
): Promise<ShareableReport> {
  if (encoded.length > MAX_COMPRESSED_BYTES) {
    throw new Error("Report payload exceeds maximum size");
  }

  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_DECOMPRESSED_BYTES) {
      throw new Error("Decompressed report exceeds maximum size");
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(combined);
  const parsed = JSON.parse(text);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.result ||
    !Array.isArray(parsed.suggestions)
  ) {
    throw new Error("Invalid report structure");
  }

  return parsed as ShareableReport;
}
