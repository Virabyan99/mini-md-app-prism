import DOMPurify from 'dompurify';

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true },
    ALLOWED_TAGS: ['svg', 'g', 'path', 'circle', 'rect', 'text', 'tspan', 'line', 'polygon', 'polyline', 'ellipse'],
    ALLOWED_ATTR: ['id', 'class', 'style', 'transform', 'd', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'opacity', 'font-size', 'font-family', 'text-anchor', 'alignment-baseline'],
  });
}