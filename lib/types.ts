export type Finding = {
  id: string; impact: string; help: string; helpUrl: string; tags: string[];
  nodes: { html: string; target: string[]; failureSummary?: string }[];
};
export type Report = {
  url: string; title: string; scannedAt: string; durationMs: number;
  violations: Finding[]; passes: number; incomplete: number;
  screenshot: string; highlightedElements: number; engine: string;
};
