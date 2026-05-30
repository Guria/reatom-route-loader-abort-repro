import {
  context,
  isSomeLoaderPending,
  noop,
  reatomRoute,
  sleep,
  urlAtom,
  withCallHook,
  wrap,
} from '@reatom/core'

const resetRuntime = () => {
  context.reset()
  urlAtom.routes = {}
  urlAtom.sync.set(() => noop)
  urlAtom.set(new URL('https://example.test/'))
}

const createTrackedRoute = (path: string, name: string, events: string[]) => {
  const route = reatomRoute(
    {
      path,
      async loader() {
        events.push(`run:${name}`)
        await wrap(sleep(1))
        return name
      },
    },
    name,
  )

  route.loader.onReject.extend(
    withCallHook(({ error }) => {
      if (error?.name === 'AbortError') {
        events.push(`reject:${name}:${error.message}`)
      }
    }),
  )

  return route
}

export const reproUrlNavigationTriggersUnmatchedLoaderAbort = async () => {
  resetRuntime()
  const events: string[] = []

  createTrackedRoute('a', 'a', events)
  createTrackedRoute('b', 'b', events)

  urlAtom.go('/a')
  await wrap(sleep(5))

  return events
}

export const reproGlobalPendingTriggersUnmatchedLoaderAbort = async () => {
  resetRuntime()
  const events: string[] = []

  createTrackedRoute('a', 'a', events)
  createTrackedRoute('b', 'b', events)

  const unsubscribe = isSomeLoaderPending.subscribe()
  await wrap(sleep(5))
  unsubscribe()

  return events
}
