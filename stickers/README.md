# No Margins Media — Sticky Peel

Website-ready export of the latest published version, 27 September 2026.
Includes the tighter curl, stronger drag resistance, firm resealing, six designs,
automatic peeling, design buttons, keyboard navigation and reduced-motion support.

## Open on your computer

Extract the ENTIRE ZIP first. Open index.html inside the extracted folder.
Keep peel.js and the assets folder next to index.html. Opening only index.html
from the ZIP or moving it away from its companion files will break the images.

## Add as a page on your website

Upload this entire folder to your website's public/static files as `stickers`.
It will then be available at `/stickers/index.html` on your own domain.
No installation, build command, account, API key or external service is required.
Your hosting provider needs to serve ordinary HTML, JavaScript and JPEG files.

For WordPress, Shopify or another managed website builder, your developer may
need access to its file hosting or theme to upload the folder. Pasting the HTML
into a text block alone is not sufficient.

## Embed in an existing page

After uploading the folder as described above, add this HTML where you want it:

```html
<iframe
  src="/stickers/index.html"
  title="No Margins Media interactive sticker collection"
  loading="lazy"
  style="display:block;width:100%;height:clamp(500px,80vh,900px);border:0;"
></iframe>
```

The iframe keeps the full-page styles contained so they do not change your
existing website layout. Change the src if you use a different folder name.

## Interaction

Grab near the edge and pull inward across the sticker. Small movements stay
attached. Release early to reseal; a deliberate longer pull reveals the next
design. The bottom buttons select designs, and the play/pause button controls
automatic peeling. Left/right arrow keys also change designs.

## Files and customisation

- index.html: page layout, styles and design thumbnails.
- peel.js: active canvas rendering and sticky-peel interaction.
- assets/: all six original JPEG designs, loaded locally.

Keep the image paths in index.html aligned with assets/. The active renderer
reads those thumbnail paths and labels. The inert text/plain script in index.html
is the previous prototype and is not executed; edit peel.js for current behaviour.

This package uses Canvas 2D to project a cylindrical fold. It does not require
Three.js, WebGL or a JavaScript framework. It is independent of the hosted demo.
