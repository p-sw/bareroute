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
import { History, useRoot, useRouter, useRouterListener } from 'bareroute';

function MyComponent() {
  const pathname = useRoot();
  const router = useRouter();

  useRouterListener((event) => {
    console.log(event.detail.method, event.detail.pathname);
  }, 'main-nav');

  return (
    <>
      <History />
      <div>
        <p>Current path: {pathname}</p>
        <button onClick={() => router.push('/new-path', undefined, { routeId: 'main-nav' })}>
          Go to /new-path
        </button>
        <button onClick={() => router.replace('/other-path')}>
          Replace with /other-path
        </button>
        <button onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    </>
  );
}
```

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

### `useRouterListener(listener, routeId)`

Subscribes to the custom event named `bareroute-route-{routeId}` and passes the `CustomEvent` to `listener`.

## License

MIT
