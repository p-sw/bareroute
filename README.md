# bareroute

A minimal, "bareroute" React hook library for managing the browser's History API.

## Installation

```bash
bun add bareroute
# or
npm install bareroute
```

## Usage

```tsx
import { useHistory } from 'bareroute';

function MyComponent() {
  const { href, push, replace, back } = useHistory();

  return (
    <div>
      <p>Current URL: {href}</p>
      <button onClick={() => push('/new-path')}>Go to /new-path</button>
      <button onClick={() => replace('/other-path')}>Replace with /other-path</button>
      <button onClick={() => back()}>Go Back</button>
    </div>
  );
}
```

## API

### `useHistory()`

Returns an object with:

- `href`: The current `window.location.href`.
- `location`: The `window.location` object.
- `state`: The `window.history.state`.
- `push(url, data?)`: Pushes a new entry to the history stack.
- `replace(url, data?)`: Replaces the current entry on the history stack.
- `go(delta)`: Moves through history by a delta.
- `back()`: Equivalent to `go(-1)`.
- `forward()`: Equivalent to `go(1)`.

## License

MIT
