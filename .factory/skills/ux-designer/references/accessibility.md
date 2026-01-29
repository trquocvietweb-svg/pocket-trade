# Accessibility Guide

## WCAG 2.2 Quick Reference

### Level AA Requirements (Minimum)

| Criterion | Requirement |
|-----------|-------------|
| **1.1.1** | Text alternatives for non-text content |
| **1.3.1** | Info and relationships conveyed programmatically |
| **1.4.3** | Contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text/UI) |
| **1.4.4** | Text resizable to 200% without loss of function |
| **1.4.10** | Content reflows at 320px width (no horizontal scroll) |
| **2.1.1** | All functionality available via keyboard |
| **2.1.2** | No keyboard traps |
| **2.4.1** | Skip navigation mechanism |
| **2.4.3** | Focus order logical and meaningful |
| **2.4.6** | Headings and labels descriptive |
| **2.4.7** | Focus visible |
| **3.1.1** | Page language identified |
| **3.2.1** | No unexpected context changes on focus |
| **3.3.1** | Input errors identified and described |
| **3.3.2** | Labels or instructions provided |
| **4.1.2** | Name, role, value for all UI components |

## ARIA Essentials

### Roles

```tsx
// Landmark roles
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

// Widget roles
<button role="button">...</button>
<div role="dialog">...</div>
<ul role="menu">...</ul>
<li role="menuitem">...</li>
<div role="tablist">...</div>
<button role="tab">...</button>
<div role="tabpanel">...</div>
<div role="alert">...</div>
<div role="alertdialog">...</div>
```

### States and Properties

```tsx
// Expanded/Collapsed
<button aria-expanded="true" aria-controls="panel-id">Toggle</button>
<div id="panel-id">Content</div>

// Selected
<div role="option" aria-selected="true">Selected item</div>

// Pressed (toggle buttons)
<button aria-pressed="true">Bold</button>

// Disabled
<button aria-disabled="true">Disabled</button>

// Invalid
<input aria-invalid="true" aria-errormessage="error-id" />
<span id="error-id">Error message</span>

// Current
<a aria-current="page">Current page</a>
<li aria-current="step">Current step</li>

// Busy/Loading
<div aria-busy="true" aria-live="polite">Loading...</div>

// Hidden from assistive tech
<span aria-hidden="true">Decorative icon</span>
```

### Labeling

```tsx
// aria-label (when no visible label)
<button aria-label="Close dialog">
  <XIcon />
</button>

// aria-labelledby (reference visible label)
<h2 id="dialog-title">Settings</h2>
<div role="dialog" aria-labelledby="dialog-title">...</div>

// aria-describedby (additional description)
<input
  aria-label="Email"
  aria-describedby="email-hint email-error"
/>
<span id="email-hint">We'll never share your email</span>
<span id="email-error">Invalid email format</span>
```

## Keyboard Navigation

### Focus Management

```tsx
// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Focus trap for modals
function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}

// Restore focus on close
function useRestoreFocus() {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    return () => {
      previouslyFocused.current?.focus();
    };
  }, []);
}
```

### Common Keyboard Patterns

```tsx
// Arrow key navigation (menus, listboxes)
function useArrowNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    let newIndex = currentIndex;

    switch (e.key) {
      case prevKey:
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case nextKey:
        e.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    items[newIndex]?.focus();
  };

  return handleKeyDown;
}

// Roving tabindex
function RovingTabIndex({ items, children }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div role="toolbar">
      {items.map((item, index) => (
        <button
          key={item.id}
          tabIndex={index === activeIndex ? 0 : -1}
          onFocus={() => setActiveIndex(index)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              const next = (index + 1) % items.length;
              setActiveIndex(next);
              document.getElementById(`item-${next}`)?.focus();
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const prev = (index - 1 + items.length) % items.length;
              setActiveIndex(prev);
              document.getElementById(`item-${prev}`)?.focus();
            }
          }}
          id={`item-${index}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

## Screen Reader Support

### Live Regions

```tsx
// Polite announcement (doesn't interrupt)
<div aria-live="polite" aria-atomic="true">
  {message}
</div>

// Assertive announcement (interrupts)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>

// Status updates
<div role="status" aria-live="polite">
  {itemCount} items in cart
</div>

// Log of messages
<div role="log" aria-live="polite">
  {messages.map(msg => <p key={msg.id}>{msg.text}</p>)}
</div>
```

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Show on focus (for skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

```tsx
// Usage
<button>
  <XIcon aria-hidden="true" />
  <span className="sr-only">Close dialog</span>
</button>

// Icon-only button
<button aria-label="Search">
  <SearchIcon aria-hidden="true" />
</button>
```

## Color and Contrast

### Contrast Ratios

```tsx
// Minimum contrast requirements
// Normal text (< 18pt): 4.5:1
// Large text (≥ 18pt or ≥ 14pt bold): 3:1
// UI components and graphics: 3:1

// Tool to check: https://webaim.org/resources/contrastchecker/

// Good contrast examples
const colors = {
  // Dark text on light background
  text: '#1f2937',        // gray-800
  background: '#ffffff',  // 12.63:1 ratio
  
  // Light text on dark background
  darkText: '#f9fafb',    // gray-50
  darkBg: '#111827',      // 18.07:1 ratio
  
  // Primary button
  primaryBg: '#2563eb',   // blue-600
  primaryText: '#ffffff', // 4.54:1 ratio (passes AA)
};
```

### Don't Rely on Color Alone

```tsx
// Bad: Color only indicates status
<span className={isError ? 'text-red-500' : 'text-green-500'}>
  {message}
</span>

// Good: Icon + color + text
<span className={cn(
  "flex items-center gap-2",
  isError ? 'text-red-500' : 'text-green-500'
)}>
  {isError ? <XIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}
  {isError ? 'Error: ' : 'Success: '}{message}
</span>

// Good: Form validation with icon
<div className="flex items-center gap-2">
  <input aria-invalid={!!error} />
  {error && (
    <>
      <AlertCircle className="text-destructive" aria-hidden="true" />
      <span className="text-destructive">{error}</span>
    </>
  )}
</div>
```

## Forms Accessibility

### Accessible Form Pattern

```tsx
function AccessibleForm() {
  return (
    <form aria-labelledby="form-title" onSubmit={handleSubmit}>
      <h2 id="form-title">Contact Form</h2>
      
      {/* Required field */}
      <div>
        <label htmlFor="name">
          Name <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="name"
          required
          aria-required="true"
          aria-describedby="name-hint"
        />
        <span id="name-hint">Enter your full name</span>
      </div>
      
      {/* Field with error */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <span id="email-error" role="alert">
            {emailError}
          </span>
        )}
      </div>
      
      {/* Group related fields */}
      <fieldset>
        <legend>Contact Preference</legend>
        <label>
          <input type="radio" name="contact" value="email" />
          Email
        </label>
        <label>
          <input type="radio" name="contact" value="phone" />
          Phone
        </label>
      </fieldset>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Error Handling

```tsx
function FormWithErrors({ errors, onSubmit }) {
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errors]);

  return (
    <form onSubmit={onSubmit}>
      {/* Error summary at top */}
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-labelledby="error-heading"
          tabIndex={-1}
          className="bg-destructive/10 p-4 rounded"
        >
          <h3 id="error-heading">
            Please fix the following {Object.keys(errors).length} errors:
          </h3>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Form fields */}
    </form>
  );
}
```

## Testing Checklist

### Manual Testing

- [ ] Navigate entire page with keyboard only
- [ ] Check focus is visible on all interactive elements
- [ ] Verify focus order is logical
- [ ] Test with screen reader (NVDA, VoiceOver)
- [ ] Check color contrast with browser dev tools
- [ ] Zoom to 200% and check layout
- [ ] Resize viewport to 320px width
- [ ] Test form validation announcements

### Automated Testing

```tsx
// axe-core with Jest
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Testing Library queries (prefer accessible queries)
import { screen } from '@testing-library/react';

// Good: Use accessible queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');
screen.getByRole('heading', { level: 2, name: 'Settings' });

// Avoid: Non-accessible queries
screen.getByTestId('submit-btn');
screen.getByClassName('btn-primary');
```

### Tools

- **axe DevTools**: Browser extension for automated checks
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit
- **VoiceOver** (macOS): Built-in screen reader
- **NVDA** (Windows): Free screen reader
- **Color Contrast Analyzer**: Check contrast ratios
