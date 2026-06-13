import {
  reproGlobalPendingTriggersUnmatchedLoaderAbort,
  reproUrlNavigationTriggersUnmatchedLoaderAbort,
} from './scenarios'

const app = document.querySelector<HTMLDivElement>('#app')!

const renderResult = (title: string, expected: string, actual: string[]) => `
  <div class="card">
    <h2>${title}</h2>
    <p><strong>Expected:</strong> ${expected}</p>
    <p><strong>Actual:</strong></p>
    <pre>${JSON.stringify(actual, null, 2)}</pre>
  </div>
`

app.innerHTML = `
  <h1>Reatom route loader AbortError repro</h1>
  <p>Package under test: <code>@reatom/core@1001.1.0</code></p>
  <p>
    Two focused repros:
    <br />1. <code>urlAtom.go('/a')</code> should not touch <code>b.loader</code>.
    <br />2. <code>isSomeLoaderPending</code> should not evaluate unmatched loaders.
  </p>
  <button id="nav">Run navigation repro</button>
  <button id="pending">Run isSomeLoaderPending repro</button>
  <div id="results"></div>
`

const results = document.querySelector<HTMLDivElement>('#results')!

document.querySelector<HTMLButtonElement>('#nav')!.onclick = async () => {
  const actual = await reproUrlNavigationTriggersUnmatchedLoaderAbort()
  results.innerHTML = renderResult(
    'Navigation repro',
    '["run:a"]',
    actual,
  ) + results.innerHTML
}

document.querySelector<HTMLButtonElement>('#pending')!.onclick = async () => {
  const actual = await reproGlobalPendingTriggersUnmatchedLoaderAbort()
  results.innerHTML = renderResult(
    'Global pending repro',
    '[]',
    actual,
  ) + results.innerHTML
}
