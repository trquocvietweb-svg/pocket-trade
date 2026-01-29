# Component Patterns

## Form Components

### Input with Validation

```tsx
interface InputFieldProps {
  label: string;
  error?: string;
  hint?: string;
}

function InputField({ label, error, hint, ...props }: InputFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "w-full rounded-md border px-3 py-2",
          error && "border-destructive"
        )}
        aria-invalid={!!error}
        aria-describedby={cn(hint && hintId, error && errorId)}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Select with Keyboard Navigation

```tsx
function AccessibleSelect({ options, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightedIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) {
          onChange(options[highlightedIndex]);
          setOpen(false);
        } else {
          setOpen(true);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <label id="select-label">{label}</label>
      <button
        role="combobox"
        aria-labelledby="select-label"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `option-${highlightedIndex}` : undefined}
        onKeyDown={handleKeyDown}
        onClick={() => setOpen(!open)}
      >
        {value?.label || 'Select...'}
      </button>
      
      {open && (
        <ul role="listbox" aria-labelledby="select-label">
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`option-${index}`}
              role="option"
              aria-selected={value?.value === option.value}
              className={cn(
                highlightedIndex === index && "bg-accent"
              )}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Checkbox Group

```tsx
function CheckboxGroup({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium mb-2">{label}</legend>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...value, option.value]);
                } else {
                  onChange(value.filter(v => v !== option.value));
                }
              }}
              className="h-4 w-4 rounded border"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

## Navigation Components

### Tabs with Keyboard Support

```tsx
function Tabs({ tabs, activeTab, onChange }) {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let newIndex = index;
    
    switch (e.key) {
      case 'ArrowLeft':
        newIndex = index === 0 ? tabs.length - 1 : index - 1;
        break;
      case 'ArrowRight':
        newIndex = index === tabs.length - 1 ? 0 : index + 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    onChange(tabs[newIndex].id);
    document.getElementById(`tab-${tabs[newIndex].id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Breadcrumb

```tsx
function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Pagination

```tsx
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center gap-1">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            Previous
          </button>
        </li>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                currentPage === page && "bg-primary text-primary-foreground"
              )}
            >
              {page}
            </button>
          </li>
        ))}
        
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
```

## Overlay Components

### Accessible Modal

```tsx
function Modal({ open, onClose, title, description, children }) {
  const titleId = useId();
  const descId = useId();
  
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        
        {description && (
          <p id={descId} className="text-sm text-muted-foreground mt-2">
            {description}
          </p>
        )}
        
        <div className="mt-4">{children}</div>
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4"
          aria-label="Close dialog"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </Portal>
  );
}
```

### Toast Notifications

```tsx
function Toast({ message, type = 'info', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg",
        type === 'success' && "bg-green-100 text-green-800",
        type === 'error' && "bg-red-100 text-red-800",
        type === 'info' && "bg-blue-100 text-blue-800"
      )}
    >
      <div className="flex items-center gap-2">
        {type === 'success' && <CheckIcon aria-hidden="true" />}
        {type === 'error' && <XIcon aria-hidden="true" />}
        {type === 'info' && <InfoIcon aria-hidden="true" />}
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="ml-4"
        aria-label="Dismiss notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
```

### Tooltip

```tsx
function Tooltip({ children, content }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="relative inline-block">
      <div
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
      
      {open && (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-sm bg-popover text-popover-foreground rounded shadow-md"
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

## Feedback Components

### Loading States

```tsx
// Skeleton loader
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// Loading spinner with announcement
function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div role="status" aria-live="polite">
      <svg className="animate-spin h-5 w-5" aria-hidden="true">
        {/* spinner SVG */}
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
```

### Progress Indicator

```tsx
function Progress({ value, max = 100, label }) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 bg-muted rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

## Data Display

### Accordion

```tsx
function Accordion({ items }) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="divide-y">
      {items.map(item => {
        const isOpen = openItems.includes(item.id);
        
        return (
          <div key={item.id}>
            <h3>
              <button
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between py-4"
              >
                {item.title}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={`panel-${item.id}`}
              role="region"
              aria-labelledby={`trigger-${item.id}`}
              hidden={!isOpen}
              className="pb-4"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Empty State

```tsx
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-3 mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```
