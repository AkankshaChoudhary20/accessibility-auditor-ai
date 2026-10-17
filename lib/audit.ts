import { chromium, type Page } from 'playwright';
import axe from 'axe-core';
import { validateTarget } from './target.mjs';
import type { Report } from './types';

export async function inspectPage(page: Page, url: string): Promise<Report> {
  const started = Date.now();
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20_000});
  await page.addScriptTag({content: axe.source});
  const result: axe.AxeResults = await page.evaluate(async () => {
    const engine = (window as unknown as {axe: {run: (root: Document, options: unknown) => Promise<axe.AxeResults>}}).axe;
    return await engine.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}});
  });
  const selectors: string[] = result.violations.flatMap(v => v.nodes.flatMap(n =>
    n.target.length === 1 && typeof n.target[0] === 'string' ? [n.target[0]] : []));
  const highlightedElements = await page.evaluate((targets: string[]) => {
    let count = 0;
    for (const target of targets) {
      try {
        const element = document.querySelector(target);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:absolute;pointer-events:none;z-index:2147483647;border:3px solid #e11d48;box-sizing:border-box;left:${rect.left + scrollX}px;top:${rect.top + scrollY}px;width:${rect.width}px;height:${rect.height}px;`;
        document.body.appendChild(overlay);
        count++;
      } catch { /* Frame/shadow selectors remain visible in the report. */ }
    }
    return count;
  }, [...new Set(selectors)]);
  const screenshot = await page.screenshot({type: 'jpeg', quality: 65, fullPage: false, timeout: 5_000});
  return {
    url: page.url(), title: await page.title(), scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started, engine: `axe-core ${result.testEngine.version}`,
    passes: result.passes.length, incomplete: result.incomplete.length,
    highlightedElements, screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
    violations: result.violations.map(v => ({id: v.id, impact: v.impact || 'unknown', help: v.help,
      helpUrl: v.helpUrl, tags: v.tags, nodes: v.nodes.map(n => ({html: n.html.slice(0,2000),
        target: n.target.map(String), failureSummary: n.failureSummary}))})),
  };
}

export async function audit(raw: string) {
  const url = await validateTarget(raw);
  const browser = await chromium.launch({headless: true, args: ['--disable-quic']});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'block', acceptDownloads: false});
    // Check every request, including redirects and subresources.
    await context.route('**/*', async route => {
      try { await validateTarget(route.request().url()); await route.continue(); }
      catch { await route.abort('blockedbyclient'); }
    });
    const page = await context.newPage();
    const timeout = setTimeout(() => void browser.close(), 45_000);
    try { return await inspectPage(page, url); }
    finally { clearTimeout(timeout); }
  } finally { await browser.close(); }
}

