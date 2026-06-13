# Reatom route loader AbortError repro

Minimal reproduction for `@reatom/core@1001.1.0` route-loader over-evaluation.

## What this shows

### 1) `urlAtom.go()` touches non-matching route loaders

Expected after navigating to `/a`:

```txt
["run:a"]
```

Actual on `1001.1.0`:

```txt
[
  "run:a",
  "reject:b:b#2.loader.withAbort unmatch [#1]"
]
```

### 2) `isSomeLoaderPending` evaluates unmatched loaders

Expected when subscribing to global loader state before any route matches:

```txt
[]
```

Actual on `1001.1.0`:

```txt
[
  "reject:a:a#1.loader.withAbort unmatch [#1]",
  "reject:b:b#2.loader.withAbort unmatch [#2]"
]
```

## Run locally

```bash
npm install
npm test
npm run dev
```

The test suite is intentionally failing on the unpatched version.

## Suspected root cause

In `@reatom/core@1001.1.0`:

- `urlAtom` proactively calls `routeAtom.loader()` for all registered routes on init and on URL change.
- `isSomeLoaderPending` reads `route.loader.pending()` for all routes, which forces loader evaluation even for unmatched routes.

That produces `AbortError` rejections with `unmatch` for routes that were never active.
