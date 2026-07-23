# Redesign Prompt for Replit Agent

## Scope — read this first
This prompt covers ONLY three things: (1) the site-wide visual/design system, (2) turning the modules page into the homepage, (3) turning the old landing page into an "About" page and editing the design of the sign-in page. Do **not** touch the content, layout, or design of individual math modules themselves (e.g. the Pythagorean theorem module) — those will get their own custom redesign in a separate prompt later. If a module page currently inherits the old dark theme, it's fine to let it inherit the new base theme automatically through shared CSS variables, but do not manually redesign, restructure, or add custom styling to any individual module in this pass.

Site name: use "Website Name" as a placeholder everywhere a site name/logo/title would appear (nav, page titles, metadata, etc). This is temporary — don't treat it as final or get creative with it.

## Context
This is a full visual redesign pass on my existing website — not a request for new features. Do not rebuild functionality from scratch; restructure existing pages and rewrite the CSS/design system.

## What to strip out completely
- Dark background and all neon glow effects (cyan/purple/magenta)
- Gradient text on headings or buzzwords
- Glassmorphism cards (blurred/translucent floating panels)
- Heavy drop shadows and glow-based elevation
- Any generic "futuristic AI product" visual language — no glowing borders, no scanline/grid backgrounds, no neon accent lines

I'm attaching a screenshot of the current dark-mode version — treat this as a "do not repeat" reference for exactly what to remove.

## Reference aesthetic: neal.fun
I'm attaching screenshots of neal.fun's homepage and a few individual modules. Study these for:
- Warm, light, cream/pearl backgrounds (not white, not dark)
- Flat, tactile module tiles with solid colors and thin/subtle borders — no glow, no floating blur
- High-contrast, clean, slightly playful typography (bold sans-serif headers, generous whitespace)
- Minimal UI chrome — the content and interactivity carry the design, not decorative effects
- Distinct, hand-picked color per tile/module rather than one uniform gradient theme

## Default color palette (site-wide base)
Use as CSS custom properties (design tokens), not hardcoded hex values, so individual modules can override them:
- `--color-bg`: #FFF1E7 (cream base)
- `--color-accent-1`: #F0FB9B (soft yellow-green)
- `--color-accent-2`: #FFCA8A (warm orange)
- `--color-accent-3`: #FFB69E (soft coral)
- Text: near-black or dark brown, not pure #000, for warmth
- Borders: thin (1-2px), solid, subtle — no box-shadow glow

## Module-level theming system
Build this as a proper design system, not one-off styles:
- Each module can define its own CSS variable overrides (background, accent, text colors) scoped to that module's page/component
- Example: a Pythagorean Theorem module should be able to use an ancient Greek palette (white, ocean blue, sandy tan) without touching the global site theme
- Structure this so adding a new themed module later just means defining a new token set, not rewriting shared components

## Page structure changes
1. **Homepage**: Replace the current landing page with the modules grid page — the modules page becomes the site's root/homepage (`/`), exactly like neal.fun's homepage. No separate marketing landing page.
2. **Old landing page**: Repurpose its content into an "About" page rather than deleting it outright — reuse existing copy/structure where possible, just restyle it.
3. **Sign-in**: Keep the sign-in page and its logic fully intact and functional, but move its entry point into the header/nav as a simple link/button — it should not be a gate users have to pass through before reaching content.
4. **Navigation**: Add a persistent header/nav bar (in the new light style — flat, no glow) with: site logo/name, "About" link, and "Sign in" link/button.

## Constraints
- Keep all existing routes, auth logic, and backend functionality working — this is a CSS/component visual pass plus the page restructuring described above, not a rebuild.
- Use CSS variables for all colors/theme values so the palette is easy to adjust later without touching component code.
- Prioritize flat design: solid fills, subtle borders, no shadow-based depth unless it's a very soft, minimal shadow for tactile "card lift," not a glow.
- Do NOT edit individual module pages/components in this pass. Only touch: the homepage/modules-grid page, the new About page, the nav/header, and shared global CSS/design tokens. If module pages automatically pick up the new base theme via shared variables, that's expected and fine — but no manual per-module design work right now.
