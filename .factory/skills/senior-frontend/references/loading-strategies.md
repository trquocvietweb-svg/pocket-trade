# Loading Strategies

## Image Loading

### Native Lazy Loading

```html
<!-- Lazy load offscreen images -->
<img src="image.jpg" loading="lazy" alt="Description" />

<!-- Eager load critical images (LCP) -->
<img src="hero.jpg" loading="eager" fetchpriority="high" alt="Hero" />
```

### Next.js Image Optimization

```tsx
import Image from 'next/image';

// Static import with automatic optimization
import profilePic from './profile.png';

// Basic usage with auto width/height
<Image src={profilePic} alt="Profile" />

// With priority for LCP
<Image src={heroImage} alt="Hero" priority />

// With blur placeholder
<Image
  src={photo}
  alt="Photo"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsive image
<Image
  src="/large.jpg"
  alt="Responsive"
  sizes="(max-width: 768px) 100vw, 50vw"
  fill
  style={{ objectFit: 'cover' }}
/>
```

### Responsive Images with srcset

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Responsive image"
/>

<!-- Preload responsive image -->
<link
  rel="preload"
  as="image"
  href="hero.jpg"
  imagesrcset="hero-400.jpg 400w, hero-800.jpg 800w"
  imagesizes="100vw"
/>
```

### Art Direction with Picture

```tsx
import { getImageProps } from 'next/image';

function ResponsiveHero() {
  const common = { alt: 'Hero', sizes: '100vw' };
  
  const { props: { srcSet: desktop } } = getImageProps({
    ...common, width: 1440, height: 600, src: '/desktop.jpg'
  });
  
  const { props: { srcSet: mobile, ...rest } } = getImageProps({
    ...common, width: 750, height: 1000, src: '/mobile.jpg'
  });

  return (
    <picture>
      <source media="(min-width: 1000px)" srcSet={desktop} />
      <source media="(min-width: 500px)" srcSet={mobile} />
      <img {...rest} style={{ width: '100%', height: 'auto' }} />
    </picture>
  );
}
```

## Code Splitting

### React.lazy with Suspense

```tsx
import { lazy, Suspense, useState } from 'react';

// Lazy load components
const HeavyChart = lazy(() => import('./HeavyChart'));
const UserProfile = lazy(() => import('./UserProfile'));

function App() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart data={chartData} />
        </Suspense>
      )}
    </div>
  );
}
```

### Next.js Dynamic Import

```tsx
import dynamic from 'next/dynamic';

// Basic dynamic import
const DynamicComponent = dynamic(() => import('./Component'));

// With loading state
const ChartWithLoading = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton height={400} />,
});

// Client-side only (no SSR)
const NoSSRComponent = dynamic(() => import('./BrowserOnly'), {
  ssr: false,
});

// Named export
const NamedExport = dynamic(() =>
  import('./module').then((mod) => mod.NamedComponent)
);
```

### Route-based Code Splitting

```tsx
// React Router
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## Resource Hints

### DNS Prefetch

```html
<!-- Resolve DNS early for external domains -->
<link rel="dns-prefetch" href="//api.example.com" />
<link rel="dns-prefetch" href="//cdn.example.com" />
<link rel="dns-prefetch" href="//analytics.google.com" />
```

### Preconnect

```html
<!-- Full connection setup (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### Prefetch

```html
<!-- Prefetch resources for next navigation -->
<link rel="prefetch" href="/next-page.html" />
<link rel="prefetch" href="/next-page-bundle.js" />
<link rel="prefetch" href="/next-page-styles.css" />
```

### Preload

```html
<!-- Preload critical resources for current page -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/critical.js" as="script" />
```

## Data Prefetching

### TanStack Query Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ArticleList() {
  const queryClient = useQueryClient();

  // Prefetch on hover
  const prefetchArticle = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['article', id],
      queryFn: () => fetchArticle(id),
      staleTime: 60000, // Only prefetch if stale
    });
  };

  return (
    <ul>
      {articles.map(article => (
        <li
          key={article.id}
          onMouseEnter={() => prefetchArticle(article.id)}
          onFocus={() => prefetchArticle(article.id)}
        >
          <Link to={`/article/${article.id}`}>{article.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### Prefetch Inside queryFn

```tsx
const { data } = useQuery({
  queryKey: ['article', id],
  queryFn: async () => {
    // Prefetch comments while fetching article
    queryClient.prefetchQuery({
      queryKey: ['comments', id],
      queryFn: () => fetchComments(id),
    });
    
    return fetchArticle(id);
  },
});
```

### usePrefetchQuery Hook

```tsx
function ArticleLayout({ id }) {
  // Prefetch before Suspense boundary
  usePrefetchQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
  });

  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article id={id} />
    </Suspense>
  );
}
```

### Pagination Prefetching

```tsx
function PaginatedList() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isPlaceholderData } = useQuery({
    queryKey: ['items', page],
    queryFn: () => fetchItems(page),
    placeholderData: keepPreviousData,
  });

  // Prefetch next page
  useEffect(() => {
    if (!isPlaceholderData && data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['items', page + 1],
        queryFn: () => fetchItems(page + 1),
      });
    }
  }, [data, isPlaceholderData, page, queryClient]);

  return (/* ... */);
}
```

## Progressive Loading Patterns

### Tiered Preloading for Galleries

```tsx
function useImagePreloader(images: string[], currentIndex: number) {
  useEffect(() => {
    // Tier 1: Current image (highest priority)
    preloadImage(images[currentIndex], 'high');
    
    // Tier 2: Adjacent images (next/prev)
    if (currentIndex > 0) preloadImage(images[currentIndex - 1]);
    if (currentIndex < images.length - 1) preloadImage(images[currentIndex + 1]);
    
    // Tier 3: Nearby images (delayed)
    const timer = setTimeout(() => {
      [-2, 2, -3, 3].forEach(offset => {
        const idx = currentIndex + offset;
        if (idx >= 0 && idx < images.length) {
          preloadImage(images[idx]);
        }
      });
    }, 500);
    
    // Tier 4: Far images (on idle)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        images.forEach((src, idx) => {
          if (Math.abs(idx - currentIndex) > 3) {
            preloadImage(src);
          }
        });
      });
    }
    
    return () => clearTimeout(timer);
  }, [images, currentIndex]);
}

function preloadImage(src: string, priority: 'high' | 'low' = 'low') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
}
```

### Skeleton UI with Fade-in

```tsx
function ImageWithSkeleton({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Failed to load</span>
        </div>
      )}
      
      {/* Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
```

### Virtual Scrolling for Long Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated row height
    overscan: 5, // render extra items for smooth scrolling
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```
