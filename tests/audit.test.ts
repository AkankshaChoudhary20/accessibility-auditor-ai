import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { inspectPage } from '../lib/audit';

test('scanner detects real barriers and creates an annotated report', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const html = '<!doctype html><html lang="en"><head><title>Broken fixture</title></head><body><main><h1>Demo</h1><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3C/svg%3E"><input><button></button></main></body></html>';
    const report = await inspectPage(page, 'data:text/html,' + encodeURIComponent(html));
    assert.equal(report.title, 'Broken fixture');
    for (const id of ['image-alt','label','button-name']) assert.ok(report.violations.some(v => v.id === id), id);
    assert.ok(report.screenshot.startsWith('data:image/jpeg;base64,'));
    assert.ok(report.highlightedElements >= 2);
    assert.ok(report.passes > 0);
    await page.close();
    const clean = await browser.newPage();
    const valid = '<!doctype html><html lang="en"><head><title>Accessible fixture</title></head><body><main><h1>Demo</h1><label for="name">Name</label><input id="name"><button>Submit</button></main></body></html>';
    const cleanReport = await inspectPage(clean, 'data:text/html,' + encodeURIComponent(valid));
    assert.equal(cleanReport.violations.length, 0);
  } finally { await browser.close(); }
});
