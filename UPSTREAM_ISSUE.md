# Upstream issue draft

## Summary

`@reatom/core@1001.1.0` eagerly evaluates route loaders for routes that do not match the current URL.

This shows up in two places:

1. `urlAtom` init / URL-change logic calls `route.loader()` for **all** registered routes.
2. `isSomeLoaderPending` reads `route.loader.pending()` for **all** routes, which itself forces loader evaluation.

As a result, non-matching routes emit `.loader.onReject` AbortErrors with `unmatch`, even though those routes were never active.

## Why this looks like a bug

The docs describe route loaders as running when the route matches and aborting when navigating away. But on `1001.1.0`, simply subscribing to `isSomeLoaderPending` or navigating to `/a` can trigger `AbortError: ... unmatch` for route `/b`.

That means:

- extra async work is scheduled for routes that are not active
- `AbortError` telemetry becomes noisy and can hide real lifecycle problems
- a global loading indicator can accidentally force loader evaluation for every route

## Minimal repros

Repository: `guria/reatom-route-loader-abort-repro`

### Repro 1: navigation touches non-matching loader

```ts
import { noop, reatomRoute, sleep, urlAtom, withCallHook, wrap } from '@reatom/core'

urlAtom.routes = {}
urlAtom.sync.set(() => noop)
urlAtom.set(new URL('https://example.test/'))

const events: string[] = []
const track = (path: string, name: string) => {
  const route = reatomRoute({
    path,
    async loader() {
      events.push(`run:${name}`)
      await wrap(sleep(1))
      return name
    },
  }, name)

  route.loader.onReject.extend(
    withCallHook(({ error }) => {
      if (error?.name === 'AbortError') events.push(`reject:${name}:${error.message}`)
    }),
  )

  return route
}

track('a', 'a')
track('b', 'b')

urlAtom.go('/a')
await wrap(sleep(5))

console.log(events)
// actual:
// [
//   'run:a',
//   'reject:b:b#2.loader.withAbort unmatch [#1]'
// ]
// expected:
// ['run:a']
```

### Repro 2: `isSomeLoaderPending` touches unmatched loaders

```ts
import {
  isSomeLoaderPending,
  noop,
  reatomRoute,
  sleep,
  urlAtom,
  withCallHook,
  wrap,
} from '@reatom/core'

urlAtom.routes = {}
urlAtom.sync.set(() => noop)
urlAtom.set(new URL('https://example.test/'))

const events: string[] = []
const track = (path: string, name: string) => {
  const route = reatomRoute({ path, async loader() { await wrap(sleep(1)); return name } }, name)
  route.loader.onReject.extend(
    withCallHook(({ error }) => {
      if (error?.name === 'AbortError') events.push(`reject:${name}:${error.message}`)
    }),
  )
  return route
}

track('a', 'a')
track('b', 'b')

isSomeLoaderPending.subscribe()
await wrap(sleep(5))

console.log(events)
// actual:
// [
//   'reject:a:a#1.loader.withAbort unmatch [#1]',
//   'reject:b:b#2.loader.withAbort unmatch [#2]'
// ]
// expected:
// []
```

## Suspected fix

The behavior goes away if these guards are added:

```ts
// url.ts
for (const [, routeAtom] of Object.entries(urlAtom.routes)) {
  if (routeAtom()) routeAtom.loader()
}

// route.ts
Object.values(urlAtom.routes).some(
  (route) => route.match() && route.loader.pending() > 0,
)
```

## Notes

I do expect aborts for a loader that was actually active and then gets replaced/unmatched due navigation.
I do **not** expect `.loader.onReject` AbortErrors for routes that were never matched in the first place.
