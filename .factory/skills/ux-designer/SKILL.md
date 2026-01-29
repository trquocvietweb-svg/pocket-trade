---
name: ux-designer
description: UI/UX design patterns, accessible components, and design system best practices. Use when building UI components, implementing accessibility (WCAG/ARIA), creating design tokens, designing forms, modals, navigation, or when user mentions UX, UI patterns, accessibility, design system, or component design.
---

# UX Designer

Practical UI/UX patterns for building accessible, consistent, and user-friendly interfaces.

## Quick Reference

### Component Anatomy (shadcn/ui Pattern)

```tsx
// Composable component pattern
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Accessibility Essentials

```tsx
// Button with proper ARIA
<button
  aria-label="Close dialog"
  aria-pressed={isPressed}      // For toggle buttons
  aria-expanded={isOpen}        // For expandable triggers
  aria-haspopup="dialog"        // For menu/dialog triggers
  onClick={handleClick}
>
  <XIcon aria-hidden="true" />
</button>

// Form field with accessibility
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby="email-error email-hint"
  />
  <span id="email-hint">We'll never share your email</span>
  {hasError && <span id="email-error" role="alert">Invalid email</span>}
</div>
```

### Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: hsl(222 47% 31%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-destructive: hsl(0 84% 60%);
  --color-muted: hsl(210 40% 96%);
  
  /* Spacing (8px base) */
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  
  /* Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

## Core Patterns

### 1. Form Field Pattern

```tsx
<Field>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input id="username" aria-describedby="username-desc" />
  <FieldDescription id="username-desc">
    Choose a unique username
  </FieldDescription>
  <FieldError>Username is required</FieldError>
</Field>

// Horizontal layout for toggles
<Field orientation="horizontal">
  <FieldContent>
    <FieldLabel htmlFor="notifications">Notifications</FieldLabel>
    <FieldDescription>Receive email updates</FieldDescription>
  </FieldContent>
  <Switch id="notifications" />
</Field>
```

### 2. Modal Dialog Pattern

```tsx
function AccessibleDialog({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        onEscapeKeyDown={onClose}
        onPointerDownOutside={onClose}
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">{title}</DialogTitle>
        </DialogHeader>
        <div id="dialog-desc">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Navigation Pattern

```tsx
// Accessible navigation with landmarks
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/" aria-current="page">Home</a>
    </li>
    <li role="none">
      <button
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        Products
      </button>
      {isOpen && (
        <ul role="menu" aria-label="Products submenu">
          <li role="none">
            <a role="menuitem" href="/products/a">Product A</a>
          </li>
        </ul>
      )}
    </li>
  </ul>
</nav>
```

### 4. Data Table Pattern

```tsx
<div role="region" aria-label="Users table" tabIndex={0}>
  <table>
    <thead>
      <tr>
        <th scope="col" aria-sort={sortDir}>
          <button onClick={toggleSort}>
            Name {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </th>
        <th scope="col">Email</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>
            <Button aria-label={`Edit ${user.name}`}>Edit</Button>
            <Button aria-label={`Delete ${user.name}`}>Delete</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Keyboard Interactions

### Common Patterns

| Component | Key | Action |
|-----------|-----|--------|
| **Button** | Enter/Space | Activate |
| **Dialog** | Escape | Close |
| **Menu** | Arrow Down/Up | Navigate items |
| **Menu** | Enter/Space | Select item |
| **Tabs** | Arrow Left/Right | Switch tabs |
| **Combobox** | Arrow Down | Open/navigate |
| **Accordion** | Enter/Space | Expand/collapse |

### Focus Management

```tsx
// Focus trap for modals
function FocusTrap({ children }) {
  const firstFocusable = useRef(null);
  const lastFocusable = useRef(null);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable.current) {
        e.preventDefault();
        lastFocusable.current?.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable.current) {
        e.preventDefault();
        firstFocusable.current?.focus();
      }
    }
  };
  
  return <div onKeyDown={handleKeyDown}>{children}</div>;
}
```

## WCAG Checklist

### Perceivable
- [ ] Text alternatives for images (`alt` text)
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI)
- [ ] Content not dependent on color alone
- [ ] Text resizable to 200%

### Operable
- [ ] All functionality via keyboard
- [ ] Visible focus indicators
- [ ] No keyboard traps
- [ ] Skip navigation links

### Understandable
- [ ] Language specified (`lang` attribute)
- [ ] Labels for all form inputs
- [ ] Clear error messages
- [ ] Consistent navigation

### Robust
- [ ] Valid semantic HTML
- [ ] ARIA labels where needed
- [ ] Works with assistive tech

## Detailed References

- [Component Patterns](references/component-patterns.md) - UI components with shadcn/ARIA
- [Accessibility Guide](references/accessibility.md) - WCAG compliance, keyboard, screen readers
- [Design Tokens](references/design-tokens.md) - Colors, spacing, typography systems

## Common UI Components

### ARIA APG Patterns (W3C)
| Pattern | Use Case |
|---------|----------|
| Accordion | Expandable content sections |
| Alert | Important messages (non-blocking) |
| Dialog | Modal windows requiring response |
| Combobox | Searchable select/autocomplete |
| Tabs | Tabbed content panels |
| Menu | Action lists, context menus |
| Tooltip | Hover/focus information |
| Breadcrumb | Navigation hierarchy |
| Carousel | Slideshows, image galleries |
| Tree View | Hierarchical lists |

### shadcn/ui Components
- **Layout**: Card, Sheet, Separator, ScrollArea
- **Forms**: Input, Select, Checkbox, Radio, Switch, Slider
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Navigation**: Tabs, Breadcrumb, Pagination, NavigationMenu
- **Overlay**: Dialog, Popover, Tooltip, DropdownMenu
- **Data**: Table, DataTable, Calendar
