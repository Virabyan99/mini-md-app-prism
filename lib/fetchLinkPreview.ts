import DOMPurify from 'dompurify';

export async function fetchLinkPreview(url: string) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const getMeta = (prop: string) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || '';
    const title = getMeta('og:title') || doc.title;
    const descriptionContent = getMeta('og:description');
    const description = DOMPurify.sanitize(descriptionContent, { USE_PROFILES: { html: true } });
    const image = getMeta('og:image');
    return { title, description, image };
  } catch (err) {
    console.error('Preview fetch error', err);
    return null;
  }
}