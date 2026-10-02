# AccessLens — Accessibility Auditor AI

A Next.js application that scans public web pages in Chromium using axe-core, displays WCAG 2.1 A/AA and best-practice findings, highlights affected elements in a screenshot, exports JSON reports, and optionally suggests markup fixes through Amazon Bedrock.

## Run locally

Requires Node.js 22 or later.

```sh
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Enter a public HTTP(S) URL. The scanner uses a fresh browser context with a desktop viewport for every audit. It scans the initial rendered document; it does not sign in, crawl the entire site, or exercise interactive flows.

## Features

- Rule violations with impact, selectors, affected HTML, remediation details, and documentation links.
- Annotated screenshot of the first 1440 × 1000 viewport. Elements elsewhere on the page are included in the findings. Complex frame/shadow selectors may not receive outlines.
- Severity filtering and downloadable JSON containing the report and screenshot.
- Separate counts for passed rules and rules requiring manual review.
- Optional AI fix suggestions for the first affected element of a rule. AWS is unnecessary for scanning.
- Per-process scan concurrency limit and a 45-second browser deadline.

## Amazon Bedrock

Set `AWS_REGION` and `BEDROCK_MODEL_ID` in `.env.local`, and configure the AWS SDK credential provider chain (for example an AWS profile locally or an IAM role in deployment). The selected model must support Converse, and your principal needs model access and `bedrock:InvokeModel` permission. Credentials stay on the server.

Clicking **Suggest a fix with AI** sends the finding ID, rule description, and up to 2,000 characters of the first affected element's HTML to Bedrock. Review generated code before applying it; page content is treated as untrusted input.

## Validation

```sh
npm run typecheck
npm test
npm run test:browser
npm run build
```

Unit tests cover URL validation and mixed public/private DNS answers. Browser tests scan intentionally broken and accessible fixtures with the actual scanner, checking violations, annotations, and screenshot generation.

## Architecture

`app/page.tsx` renders the UI. `POST /api/audit` launches Chromium and calls `lib/audit.ts`. axe-core produces findings, then overlays are drawn before capturing a screenshot. `POST /api/suggest` calls Bedrock Converse. Nothing is persisted server-side; a reload clears the report. Export reports if you need to retain them.

## Operational limits

This MVP binds to loopback by default. Destination validation rejects private/local addresses, unsafe URL schemes, credentials, and nonstandard ports, and checks redirects and subresources. DNS validation alone is not a complete defense against DNS rebinding: before exposing the scanner publicly, enforce private-network blocking at the browser worker's network boundary, add authentication/rate limits, and isolate browser workers with resource limits. Do not run it with privileged cloud/network access.

Automated checks only identify a subset of accessibility barriers. Passed checks do not prove WCAG conformance. Keyboard navigation, screen readers, meaningful content, and dynamic states need manual review.

## Reference documentation

- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)
- [Bedrock Converse](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

MIT licensed.

See [VALIDATION.md](VALIDATION.md) for the checks performed and environment limitations during initial development.
