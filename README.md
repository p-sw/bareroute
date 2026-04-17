# bareroute

A minimal React routing helper for the browser History API.

## Installation

```bash
bun add bareroute
# or
npm install bareroute
```

## Usage

```tsx
import { useState } from 'react';
import { History, useRoot, useRouter, useRouterListener } from 'bareroute';

function App() {
  const pathname = useRoot();

  let page = <NotFoundPage />;

  if (pathname === '/') {
    page = <HomePage />;
  } else if (pathname === '/settings') {
    page = <SettingsPage />;
  }

  return (
    <>
      <History />
      <main>{page}</main>
    </>
  );
}

function HomePage() {
  const router = useRouter();

  return (
    <section>
      <h1>Home</h1>
      <p>This button uses the default root refresh flow.</p>
      <button onClick={() => router.push('/settings')}>
        Go to settings page
      </button>
    </section>
  );
}

function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('profile');

  useRouterListener((event) => {
    const nextTab = new URL(event.detail.href).searchParams.get('tab');

    if (nextTab) {
      setTab(nextTab);
    }
  }, 'settings-tab');

  return (
    <section>
      <h1>Settings</h1>
      <p>Active tab: {tab}</p>

      <button onClick={() => router.push('/?from=settings')}>
        Back to home with root refresh
      </button>

      <button
        onClick={() => {
          router.replace('/settings?tab=billing', undefined, {
            refreshRoot: false,
            routeId: 'settings-tab',
          });
        }}
      >
        Switch to billing without changing the root page
      </button>
    </section>
  );
}

function NotFoundPage() {
  const router = useRouter();

  return (
    <section>
      <h1>Not found</h1>
      <button onClick={() => router.replace('/')}>
        Go home
      </button>
    </section>
  );
}
```

Place `<History />` once in the app root. Use `useRoot()` there to decide which page component should render, and keep `useRouter()` and `useRouterListener()` inside the page components that own the navigation behavior.

## API

### `<History />`

Registers the `popstate` listener that refreshes `useRoot()` when browser navigation changes the current entry.

### `useRoot()`

Returns the current `window.location.pathname` and updates when `bareroute-refresh-root` is dispatched.

### `useRouter()`

Returns an object with:

- `push(url, data?, options?)`
- `replace(url, data?, options?)`
- `go(delta, options?)`
- `back(options?)`
- `forward(options?)`

Each method accepts `options.refreshRoot`, which defaults to `true`, and `options.routeId`, which dispatches a matching `bareroute-route-{id}` event for `useRouterListener()`.

When `options.refreshRoot` is `false`, `options.routeId` is required.

`push()` and `replace()` persist the `refreshRoot` setting into the history state so `History` can ignore later `popstate` updates for entries that were created with `refreshRoot: false`.

### `useRouterListener(listener, routeId)`

Subscribes to the custom event named `bareroute-route-{routeId}` and passes the `CustomEvent` to `listener`.

The listener receives `event.detail.dispatchRootRefresh()`, which lets you manually refresh `useRoot()` when a route method was called with `refreshRoot: false`.

## License

MIT
