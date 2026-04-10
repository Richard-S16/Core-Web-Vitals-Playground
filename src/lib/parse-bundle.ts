import type { PSIResponse } from "@/types/pagespeed";

export interface BundleNode {
  name: string;
  size: number;
  children?: BundleNode[];
  resourceType?: string;
}

export interface BundleData {
  firstParty: BundleNode[];
  thirdParty: BundleNode[];
  totalBytes: number;
  firstPartyBytes: number;
  thirdPartyBytes: number;
}

interface ScriptTreemapNode {
  name?: string;
  resourceBytes?: number;
  unusedBytes?: number;
  children?: ScriptTreemapNode[];
}

interface ScriptTreemapAudit {
  details?: {
    type?: string;
    nodes?: ScriptTreemapNode[];
  };
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isFirstParty(scriptUrl: string, pageUrl: string): boolean {
  try {
    const scriptHost = new URL(scriptUrl).hostname;
    const pageHost = new URL(pageUrl).hostname;
    // Match root domain (e.g., sub.example.com matches example.com)
    const getRootDomain = (host: string) => {
      const parts = host.split(".");
      return parts.length >= 2 ? parts.slice(-2).join(".") : host;
    };
    return getRootDomain(scriptHost) === getRootDomain(pageHost);
  } catch {
    return true;
  }
}

function flattenNodes(node: ScriptTreemapNode): BundleNode[] {
  if (node.children && node.children.length > 0) {
    return node.children.flatMap(flattenNodes);
  }
  return [
    {
      name: node.name ?? "unknown",
      size: node.resourceBytes ?? 0,
    },
  ];
}

export function parseBundleData(raw: PSIResponse): BundleData | null {
  const audit = raw.lighthouseResult.audits[
    "script-treemap-data"
  ] as unknown as ScriptTreemapAudit | undefined;

  if (!audit?.details?.nodes?.length) return null;

  const pageUrl = raw.lighthouseResult.requestedUrl ?? raw.id ?? "";
  const firstPartyMap = new Map<string, number>();
  const thirdPartyMap = new Map<string, number>();
  let totalBytes = 0;
  let firstPartyBytes = 0;
  let thirdPartyBytes = 0;

  for (const node of audit.details.nodes) {
    const scriptUrl = node.name ?? "";
    const bytes = node.resourceBytes ?? 0;
    totalBytes += bytes;

    const isFirst = isFirstParty(scriptUrl, pageUrl);
    const hostname = extractHostname(scriptUrl);

    if (isFirst) {
      firstPartyBytes += bytes;
      firstPartyMap.set(
        hostname,
        (firstPartyMap.get(hostname) ?? 0) + bytes
      );
    } else {
      thirdPartyBytes += bytes;
      thirdPartyMap.set(
        hostname,
        (thirdPartyMap.get(hostname) ?? 0) + bytes
      );
    }
  }

  const toNodes = (map: Map<string, number>): BundleNode[] =>
    Array.from(map.entries())
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size);

  return {
    firstParty: toNodes(firstPartyMap),
    thirdParty: toNodes(thirdPartyMap),
    totalBytes,
    firstPartyBytes,
    thirdPartyBytes,
  };
}
