# Core Web Vitals Optimization

## Overview

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4s | > 4s |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3s | > 3s |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms - 500ms | > 500ms |

## Largest Contentful Paint (LCP)

### LCP Elements
- `<img>` elements
- `<image>` inside `<svg>`
- `<video>` poster images
- Elements with `background-image`
- Block-level elements with text

### LCP Optimization Strategies

#### 1. Preload LCP Image

```html
<!-- In document head -->
<link 
  rel="preload" 
  as="image" 
  href="/hero-image.jpg" 
  fetchpriority="high"
/>

<!-- For responsive images -->
<link
  rel="preload"
  as="image"
  href="/hero.jpg"
  imagesrcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  imagesizes="100vw"
/>
```

#### 2. Optimize Image Loading

```tsx
// Next.js - Use priority for LCP image
<Image 
  src="/hero.jpg" 
  alt="Hero" 
  priority 
  sizes="100vw"
/>

// Native - Use fetchpriority
<img 
  src="/hero.jpg" 
  alt="Hero" 
  fetchpriority="high"
  loading="eager"
/>
```

#### 3. Reduce Resource Load Delay

```html
<!-- Preconnect to image CDN -->
<link rel="preconnect" href="https://cdn.example.com" />

<!-- DNS prefetch as fallback -->
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

#### 4. Avoid Lazy Loading LCP

```tsx
// Bad: Lazy loading LCP image
<img src="/hero.jpg" loading="lazy" />

// Good: Eager load + high priority
<img src="/hero.jpg" loading="eager" fetchpriority="high" />
```

#### 5. Optimize Server Response (TTFB)

- Use CDN for static assets
- Enable compression (Brotli/gzip)
- Implement caching headers
- Use HTTP/2 or HTTP/3

## First Contentful Paint (FCP)

### FCP Optimization Strategies

#### 1. Eliminate Render-Blocking Resources

```html
<!-- Defer non-critical CSS -->
<link rel="preload" href="non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>

<!-- Defer non-critical JS -->
<script src="analytics.js" defer></script>

<!-- Async for independent scripts -->
<script src="widget.js" async></script>
```

#### 2. Inline Critical CSS

```html
<head>
  <style>
    /* Critical above-the-fold CSS */
    .hero { display: flex; min-height: 100vh; }
    .nav { position: fixed; top: 0; }
    /* ... */
  </style>
  <link rel="preload" href="full.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</head>
```

#### 3. Preload Critical Resources

```html
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/critical-script.js" as="script">
```

#### 4. Optimize Web Fonts

```css
/* Use font-display to avoid FOIT */
@font-face {
  font-family: 'Custom Font';
  src: url('/font.woff2') format('woff2');
  font-display: swap; /* or optional */
}
```

## Cumulative Layout Shift (CLS)

### Common Causes
- Images without dimensions
- Ads, embeds without reserved space
- Dynamically injected content
- Web fonts causing FOIT/FOUT

### CLS Optimization Strategies

#### 1. Set Image Dimensions

```tsx
// Always provide width and height
<img src="/photo.jpg" width="800" height="600" alt="Photo" />

// Next.js handles this automatically
<Image src="/photo.jpg" width={800} height={600} alt="Photo" />

// For responsive images, use aspect-ratio
<img 
  src="/photo.jpg" 
  style={{ aspectRatio: '16/9', width: '100%', height: 'auto' }}
  alt="Photo"
/>
```

#### 2. Reserve Space for Dynamic Content

```css
/* Reserve space for ads */
.ad-container {
  min-height: 250px;
  width: 300px;
}

/* Reserve space for embeds */
.embed-container {
  aspect-ratio: 16/9;
  width: 100%;
}
```

#### 3. Avoid Inserting Content Above Existing

```tsx
// Bad: Inserting banner at top pushes content down
function Page() {
  const [showBanner, setShowBanner] = useState(false);
  
  return (
    <>
      {showBanner && <Banner />} {/* Causes layout shift! */}
      <Content />
    </>
  );
}

// Good: Reserve space or use transform
function Page() {
  const [showBanner, setShowBanner] = useState(false);
  
  return (
    <>
      <div style={{ minHeight: showBanner ? 'auto' : '60px' }}>
        {showBanner && <Banner />}
      </div>
      <Content />
    </>
  );
}
```

#### 4. Use CSS Containment

```css
.card {
  contain: layout; /* Isolate layout calculations */
}

.sidebar {
  contain: strict; /* Full containment */
}
```

## Interaction to Next Paint (INP)

### INP Optimization Strategies

#### 1. Break Up Long Tasks

```tsx
// Bad: Long synchronous task
function processAllItems(items) {
  items.forEach(item => heavyProcess(item)); // Blocks main thread
}

// Good: Yield to main thread
async function processAllItems(items) {
  for (const item of items) {
    heavyProcess(item);
    
    // Yield every 50ms
    if (performance.now() % 50 < 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Using scheduler.yield() (when available)
async function processWithYield(items) {
  for (const item of items) {
    heavyProcess(item);
    await scheduler.yield?.();
  }
}
```

#### 2. Use Web Workers for Heavy Computation

```tsx
// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// main.js
const worker = new Worker('/worker.js');

function computeHeavy(data) {
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(data);
  });
}
```

#### 3. Debounce/Throttle Event Handlers

```tsx
function SearchInput() {
  const [query, setQuery] = useState('');
  
  // Debounce expensive search
  const debouncedSearch = useMemo(
    () => debounce((q) => performSearch(q), 300),
    []
  );

  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

#### 4. Use useTransition for Non-Urgent Updates

```tsx
function FilteredList({ items }) {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (e) => {
    // Urgent: Update input immediately
    setFilter(e.target.value);
    
    // Non-urgent: Filter list with lower priority
    startTransition(() => {
      setFilteredItems(filterItems(items, e.target.value));
    });
  };

  return (
    <>
      <input value={filter} onChange={handleFilterChange} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <ItemList items={filteredItems} />
      </div>
    </>
  );
}
```

## Measuring Core Web Vitals

### Using web-vitals Library

```tsx
import { onCLS, onFCP, onLCP, onINP } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  // Send to your analytics service
  console.log({ name, value, id });
}

onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onINP(sendToAnalytics);
```

### Next.js Built-in Reporting

```tsx
// pages/_app.js or app/layout.js
export function reportWebVitals(metric) {
  console.log(metric);
  
  // Send to analytics
  if (metric.label === 'web-vital') {
    analytics.track(metric.name, {
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }
}
```

### Chrome DevTools

1. **Lighthouse**: Full audit with CWV scores
2. **Performance Panel**: Record and analyze
3. **Web Vitals Extension**: Real-time monitoring

### Field Data Sources

- **Google Search Console**: CWV report
- **Chrome User Experience Report (CrUX)**: Real user data
- **PageSpeed Insights**: Lab + field data

## Quick Wins Checklist

### LCP
- [ ] Preload hero/LCP image
- [ ] Use `fetchpriority="high"` on LCP element
- [ ] Don't lazy load above-fold images
- [ ] Preconnect to image CDN
- [ ] Use modern image formats (WebP, AVIF)

### FCP
- [ ] Inline critical CSS
- [ ] Defer non-critical CSS/JS
- [ ] Use font-display: swap
- [ ] Enable compression (Brotli)
- [ ] Use CDN

### CLS
- [ ] Set width/height on all images
- [ ] Reserve space for dynamic content
- [ ] Avoid inserting content above existing
- [ ] Use CSS containment

### INP
- [ ] Break up long tasks (< 50ms chunks)
- [ ] Use Web Workers for heavy computation
- [ ] Debounce/throttle event handlers
- [ ] Use useTransition for non-urgent updates
