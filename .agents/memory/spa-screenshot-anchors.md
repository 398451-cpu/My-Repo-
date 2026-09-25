---
name: SPA screenshot anchors
description: Fragment URLs can fail to scroll to sections rendered after client-side app startup.
---

When taking a screenshot of a below-the-fold section in a client-rendered app, a URL fragment may be processed before the target element mounts, leaving the screenshot at the top of the page. Use a tall viewport capture or otherwise wait for the SPA render before judging the section.

**Why:** The app preview opened the correct route but stayed at the top even when given the chart's fragment; a taller Chromium capture made the rendered section visible.

**How to apply:** For static app screenshots, distinguish route-loading failures from fragment timing; verify with a tall viewport capture before changing app code to support the screenshot.