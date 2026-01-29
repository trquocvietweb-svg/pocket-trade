# React Performance Optimization

## Memoization

### React.memo for Components

```tsx
// Prevent re-renders when props haven't changed
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

// With custom comparison
const OptimizedCard = React.memo(
  function Card({ data, onClick }) {
    return (
      <div onClick={onClick}>
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### useMemo for Expensive Calculations

```tsx
function ProductList({ products, filter }) {
  // Only recalculate when products or filter changes
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  const stats = useMemo(() => ({
    total: filteredProducts.length,
    avgPrice: filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length,
  }), [filteredProducts]);

  return (
    <div>
      <p>Showing {stats.total} products (avg: ${stats.avgPrice})</p>
      {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

### useCallback for Stable Function References

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  // Stable reference - won't cause child re-renders
  const handleClick = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []); // Empty deps = never changes

  // Depends on count
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Use functional update to avoid count dependency

  return (
    <div>
      <Counter count={count} onIncrement={handleIncrement} />
      <ItemList items={items} onRemove={handleClick} />
    </div>
  );
}

// Child won't re-render unless items/onRemove actually change
const ItemList = React.memo(function ItemList({ items, onRemove }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onRemove(item.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
});
```

## Suspense & Concurrent Features

### Basic Suspense

```tsx
import { Suspense, lazy } from 'react';

const Comments = lazy(() => import('./Comments'));
const Sidebar = lazy(() => import('./Sidebar'));

function App() {
  return (
    <div>
      <Header />
      <main>
        <Suspense fallback={<ArticleSkeleton />}>
          <Article />
        </Suspense>
        
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments />
        </Suspense>
      </main>
      
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  );
}
```

### Nested Suspense Boundaries

```tsx
function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayout>
        <Suspense fallback={<ChartSkeleton />}>
          <Charts />
        </Suspense>
        
        <Suspense fallback={<TableSkeleton />}>
          <DataTable />
        </Suspense>
        
        <Suspense fallback={<FeedSkeleton />}>
          <ActivityFeed />
        </Suspense>
      </DashboardLayout>
    </Suspense>
  );
}
```

### useDeferredValue

```tsx
function SearchResults({ query }) {
  // Defer the search query to prevent UI blocking
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const results = useMemo(
    () => searchItems(deferredQuery),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      {results.map(item => (
        <ResultItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### useTransition

```tsx
function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div>
      <TabButtons onSelect={selectTab} />
      <div style={{ opacity: isPending ? 0.8 : 1 }}>
        {tab === 'home' && <HomeTab />}
        {tab === 'posts' && <PostsTab />}
        {tab === 'contact' && <ContactTab />}
      </div>
    </div>
  );
}
```

## State Management Optimization

### Avoid Unnecessary State

```tsx
// Bad: Derived state in useState
function BadComponent({ items }) {
  const [count, setCount] = useState(items.length);
  
  useEffect(() => {
    setCount(items.length); // Extra render!
  }, [items]);
  
  return <span>Count: {count}</span>;
}

// Good: Calculate during render
function GoodComponent({ items }) {
  const count = items.length; // No extra state/render
  return <span>Count: {count}</span>;
}
```

### State Colocation

```tsx
// Bad: State too high up
function App() {
  const [inputValue, setInputValue] = useState(''); // Causes full app re-render
  
  return (
    <Layout>
      <Header />
      <SearchBar value={inputValue} onChange={setInputValue} />
      <Content />
      <Footer />
    </Layout>
  );
}

// Good: State colocated with consumer
function App() {
  return (
    <Layout>
      <Header />
      <SearchBar /> {/* Has its own state */}
      <Content />
      <Footer />
    </Layout>
  );
}

function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  return <input value={inputValue} onChange={e => setInputValue(e.target.value)} />;
}
```

### Context Optimization

```tsx
// Split contexts by update frequency
const UserContext = createContext(null); // Rarely changes
const ThemeContext = createContext(null); // Rarely changes
const CartContext = createContext(null); // Changes often

// Memoize context value
function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  const value = useMemo(() => ({
    items,
    addItem: (item) => setItems(prev => [...prev, item]),
    removeItem: (id) => setItems(prev => prev.filter(i => i.id !== id)),
    total: items.reduce((sum, i) => sum + i.price, 0),
  }), [items]);
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
```

## List Rendering Optimization

### Stable Keys

```tsx
// Bad: Index as key (breaks on reorder/filter)
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// Good: Unique stable key
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### Virtualization for Long Lists

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Event Handling Optimization

### Debounce for Search

```tsx
function SearchInput({ onSearch }) {
  const [value, setValue] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((query) => onSearch(query), 300),
    [onSearch]
  );
  
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={value} onChange={handleChange} />;
}
```

### Throttle for Scroll/Resize

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = throttle(() => {
      setScrollY(window.scrollY);
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <ProgressBar progress={scrollY / document.body.scrollHeight} />;
}
```

## Profiling & Debugging

### React DevTools Profiler

```tsx
// Wrap components to measure
import { Profiler } from 'react';

function onRenderCallback(
  id, // the "id" prop of the Profiler tree
  phase, // "mount" or "update"
  actualDuration, // time spent rendering
  baseDuration, // estimated time without memoization
  startTime,
  commitTime
) {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <MainContent />
    </Profiler>
  );
}
```

### Why Did You Render

```tsx
// In development only
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}

// Mark specific components
MyComponent.whyDidYouRender = true;
```

## Common Anti-patterns

### Creating Objects/Arrays in Render

```tsx
// Bad: New object every render
<Component style={{ color: 'red' }} />
<Component data={[1, 2, 3]} />

// Good: Stable reference
const style = { color: 'red' };
const data = [1, 2, 3];
<Component style={style} />
<Component data={data} />

// Or with useMemo
const style = useMemo(() => ({ color: 'red' }), []);
```

### Inline Functions Without useCallback

```tsx
// Bad: New function every render (if child is memoized)
<MemoizedChild onClick={() => handleClick(id)} />

// Good: Stable callback
const handleChildClick = useCallback(() => handleClick(id), [id]);
<MemoizedChild onClick={handleChildClick} />
```
