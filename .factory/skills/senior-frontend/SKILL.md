---
name: senior-frontend
description: Frontend performance optimization, loading strategies, and best practices. Use when optimizing images, implementing lazy loading, preloading, code splitting, improving Core Web Vitals (LCP, FCP, CLS), React performance, caching strategies, or when user mentions performance, loading speed, optimization, bundle size, or render performance.
---

# Senior Frontend Performance

Complete toolkit for frontend performance optimization with modern loading strategies.

## Quick Reference

### Image Loading Strategies

```tsx
// 1. Lazy loading - defer offscreen images
<img src="image.jpg" loading="lazy" alt="..." />

// 2. Preload LCP image - critical above-fold images
<link rel="preload" as="image" href="hero.jpg" fetchpriority="high" />

// 3. Next.js Image with priority
<Image src={hero} alt="Hero" priority />

// 4. Blur placeholder while loading
<Image src={img} placeholder="blur" blurDataURL={blurUrl} />
```

### Code Splitting & Lazy Loading

```tsx
// React.lazy + Suspense
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>

// Next.js dynamic import
const DynamicChart = dynamic(() => import('./Chart'), {
  loading: () => <Spinner />,
  ssr: false // client-side only
});
```

### Resource Hints

```html
<!-- DNS prefetch for external domains -->
<link rel="dns-prefetch" href="//api.example.com" />

<!-- Preconnect for critical third-party -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- Prefetch next page resources -->
<link rel="prefetch" href="/next-page.js" />

<!-- Preload critical resources -->
<link rel="preload" href="/critical.css" as="style" />
```

### Data Prefetching (TanStack Query)

```tsx
// Prefetch on hover
const prefetch = () => {
  queryClient.prefetchQuery({
    queryKey: ['details', id],
    queryFn: fetchDetails,
    staleTime: 60000,
  });
};

<button onMouseEnter={prefetch} onFocus={prefetch}>
  Show Details
</button>
```

## Core Strategies

### 1. Tiered Image Preloading

For image-heavy apps (galleries, flipbooks, carousels):

```tsx
const preloadImage = (src: string, priority: 'high' | 'low' = 'low') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
};

// Priority tiers:
// Tier 1: Current view (priority: high)
// Tier 2: Adjacent (next/prev) - immediate preload
// Tier 3: Nearby (n+2, n-2) - delayed preload
// Tier 4: Far pages - on idle
```

### 2. Skeleton UI Pattern

```tsx
function ImageWithSkeleton({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!loaded && (
        <div className="skeleton animate-pulse bg-gray-200 absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
      />
    </div>
  );
}
```

### 3. Intersection Observer for Lazy Loading

```tsx
function useLazyLoad(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px', ...options });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  
  return isVisible;
}
```

## Detailed References

- [Loading Strategies](references/loading-strategies.md) - Image, resource, and data loading
- [React Performance](references/react-performance.md) - Memoization, Suspense, concurrent features
- [Core Web Vitals](references/core-web-vitals.md) - LCP, FCP, CLS, INP optimization

## Performance Checklist

### Images
- [ ] Use `loading="lazy"` for below-fold images
- [ ] Preload LCP image with `fetchpriority="high"`
- [ ] Use modern formats (WebP, AVIF)
- [ ] Implement responsive images with `srcset`
- [ ] Add blur placeholder for better UX

### JavaScript
- [ ] Code split routes and heavy components
- [ ] Use dynamic imports for conditional features
- [ ] Defer non-critical scripts
- [ ] Tree-shake unused code

### CSS
- [ ] Inline critical CSS
- [ ] Defer non-critical stylesheets
- [ ] Remove unused CSS
- [ ] Use CSS containment

### Caching
- [ ] Implement proper cache headers
- [ ] Use service workers for offline
- [ ] Prefetch likely navigation targets
- [ ] Cache API responses (TanStack Query, SWR)

### Metrics to Monitor
- **LCP** < 2.5s (Largest Contentful Paint)
- **FCP** < 1.8s (First Contentful Paint)
- **CLS** < 0.1 (Cumulative Layout Shift)
- **INP** < 200ms (Interaction to Next Paint)
