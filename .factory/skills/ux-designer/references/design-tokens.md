# Design Tokens

## What Are Design Tokens?

Design tokens are named entities that store visual design attributes (colors, spacing, typography, etc.) in a platform-agnostic way. They serve as a single source of truth between design and code.

## Color System

### Semantic Colors (CSS Variables)

```css
:root {
  /* Background colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Card colors */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  /* Primary (brand) */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  /* Muted (subtle backgrounds) */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Accent (hover states) */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  /* Destructive (errors, danger) */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Border & Input */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... other dark values */
}
```

### Using Colors in Tailwind

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
    },
  },
}

// Usage
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
  <button className="bg-secondary text-secondary-foreground">
    Secondary Button
  </button>
</div>
```

### Status Colors

```css
:root {
  /* Success */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  
  /* Warning */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
  
  /* Info */
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
  
  /* Error (alias for destructive) */
  --error: var(--destructive);
  --error-foreground: var(--destructive-foreground);
}
```

## Spacing System

### 8px Base Grid

```css
:root {
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0.5: 0.125rem;  /* 2px */
  --spacing-1: 0.25rem;     /* 4px */
  --spacing-1.5: 0.375rem;  /* 6px */
  --spacing-2: 0.5rem;      /* 8px */
  --spacing-2.5: 0.625rem;  /* 10px */
  --spacing-3: 0.75rem;     /* 12px */
  --spacing-3.5: 0.875rem;  /* 14px */
  --spacing-4: 1rem;        /* 16px */
  --spacing-5: 1.25rem;     /* 20px */
  --spacing-6: 1.5rem;      /* 24px */
  --spacing-7: 1.75rem;     /* 28px */
  --spacing-8: 2rem;        /* 32px */
  --spacing-9: 2.25rem;     /* 36px */
  --spacing-10: 2.5rem;     /* 40px */
  --spacing-12: 3rem;       /* 48px */
  --spacing-14: 3.5rem;     /* 56px */
  --spacing-16: 4rem;       /* 64px */
  --spacing-20: 5rem;       /* 80px */
  --spacing-24: 6rem;       /* 96px */
}
```

### Common Spacing Usage

```tsx
// Component spacing
const spacingGuide = {
  // Tight (inline elements)
  iconGap: 'gap-1',      // 4px
  badgePadding: 'px-2',  // 8px horizontal
  
  // Default (form elements)
  inputPadding: 'px-3 py-2',  // 12px x 8px
  buttonPadding: 'px-4 py-2', // 16px x 8px
  
  // Relaxed (cards, sections)
  cardPadding: 'p-6',    // 24px
  sectionGap: 'gap-8',   // 32px
  
  // Spacious (page layout)
  pageMargin: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  sectionMargin: 'py-12 md:py-16 lg:py-24',
};
```

## Typography System

### Font Scale

```css
:root {
  /* Font families */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  
  /* Font sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  
  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* Font weights */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  
  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

### Typography Presets

```tsx
// Heading styles
const headingStyles = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
};

// Body text styles
const textStyles = {
  large: 'text-lg font-semibold',
  base: 'text-base leading-7',
  small: 'text-sm font-medium leading-none',
  muted: 'text-sm text-muted-foreground',
};

// Usage
<h1 className={headingStyles.h1}>Page Title</h1>
<p className={textStyles.base}>Body text...</p>
<span className={textStyles.muted}>Helper text</span>
```

## Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-DEFAULT: 0.25rem; /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

```tsx
// Common usage
const radiusGuide = {
  button: 'rounded-md',    // 6px
  input: 'rounded-md',     // 6px
  card: 'rounded-lg',      // 8px
  modal: 'rounded-xl',     // 12px
  avatar: 'rounded-full',  // Circle
  badge: 'rounded-full',   // Pill shape
};
```

## Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

```tsx
// Common usage
const shadowGuide = {
  card: 'shadow-sm',         // Subtle elevation
  cardHover: 'shadow-md',    // Hover state
  dropdown: 'shadow-lg',     // Floating elements
  modal: 'shadow-xl',        // Modals, dialogs
  tooltip: 'shadow-md',      // Tooltips
};
```

## Animation & Transitions

```css
:root {
  /* Durations */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* Timing functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

```tsx
// Common transitions
const transitions = {
  // Fast (micro-interactions)
  fast: 'transition-colors duration-150',
  
  // Normal (general UI)
  normal: 'transition-all duration-200 ease-in-out',
  
  // Slow (emphasis)
  slow: 'transition-all duration-300 ease-in-out',
  
  // Transform
  transform: 'transition-transform duration-200 ease-out',
};

// Animation keyframes
const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  zoomIn: 'animate-in zoom-in-95 duration-200',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};
```

## Z-Index Scale

```css
:root {
  --z-0: 0;
  --z-10: 10;      /* Positioned elements */
  --z-20: 20;      /* Dropdowns */
  --z-30: 30;      /* Fixed headers */
  --z-40: 40;      /* Modals backdrop */
  --z-50: 50;      /* Modals, dialogs */
  --z-60: 60;      /* Tooltips */
  --z-70: 70;      /* Toasts */
  --z-auto: auto;
}
```

```tsx
// Usage guide
const zIndexGuide = {
  dropdown: 'z-20',
  sticky: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  tooltip: 'z-60',
  toast: 'z-70',
};
```

## Responsive Breakpoints

```css
/* Default breakpoints (mobile-first) */
:root {
  --breakpoint-sm: 640px;   /* Small devices */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}
```

```tsx
// Tailwind usage
<div className="
  px-4           /* Mobile: 16px padding */
  sm:px-6        /* ≥640px: 24px padding */
  lg:px-8        /* ≥1024px: 32px padding */
">
  <h1 className="
    text-2xl       /* Mobile: 24px */
    sm:text-3xl    /* ≥640px: 30px */
    lg:text-4xl    /* ≥1024px: 36px */
  ">
    Responsive Heading
  </h1>
</div>
```

## Complete Token Example

```tsx
// tokens.ts - Design tokens as TypeScript
export const tokens = {
  colors: {
    primary: {
      50: 'hsl(210, 100%, 97%)',
      100: 'hsl(210, 100%, 94%)',
      500: 'hsl(210, 100%, 50%)',
      600: 'hsl(210, 100%, 45%)',
      700: 'hsl(210, 100%, 40%)',
    },
    gray: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 96%)',
      200: 'hsl(210, 16%, 93%)',
      300: 'hsl(210, 14%, 83%)',
      400: 'hsl(210, 12%, 63%)',
      500: 'hsl(210, 10%, 45%)',
      600: 'hsl(210, 12%, 35%)',
      700: 'hsl(210, 14%, 25%)',
      800: 'hsl(210, 18%, 15%)',
      900: 'hsl(210, 24%, 10%)',
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
  },
  borderRadius: {
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
} as const;
```
