import type { AuditResult } from "@/types/metrics";
import type { Suggestion } from "@/lib/suggestions-engine";

export interface ShareableReport {
  result: AuditResult;
  suggestions: Suggestion[];
}

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

  const decompressed = await new Response(ds.readable).text();
  return JSON.parse(decompressed) as ShareableReport;
}
