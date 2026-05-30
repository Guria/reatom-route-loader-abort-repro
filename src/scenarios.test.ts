import { expect, test } from 'vitest'

import {
  reproGlobalPendingTriggersUnmatchedLoaderAbort,
  reproUrlNavigationTriggersUnmatchedLoaderAbort,
} from './scenarios'

test('urlAtom.go should not touch non-matching route loaders', async () => {
  await expect(reproUrlNavigationTriggersUnmatchedLoaderAbort()).resolves.toEqual(['run:a'])
})

test('isSomeLoaderPending should not evaluate non-matching route loaders', async () => {
  await expect(reproGlobalPendingTriggersUnmatchedLoaderAbort()).resolves.toEqual([])
})
