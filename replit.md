# Mason Rhine About Me Website

## Run

This is a Vite + React multi-page About Me website with an Express server and JSON storage.

```bash
npm run dev
```

The development server listens on port 5000 and is configured for the Replit preview.

## Pages

- `/` — Home
- `/media` — Media gallery placeholders
- `/future` — Future goals placeholders
- `/choice-1` and `/choice-2` — Choice topic placeholders
- `/contact` — Contact form
- `/admin` — Password-protected message dashboard

## Content

Personal content is stored in `data/content.json`. Replace the labeled placeholders with your own writing, links, and original media references.

## Admin password

Set an `ADMIN_PASSWORD` environment secret before using the Admin page. The local fallback is intentionally named `change-me-before-publishing` and should not be used for a published website.