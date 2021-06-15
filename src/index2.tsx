/* eslint-disable @typescript-eslint/no-namespace */
import * as core from './core'
import { createElement } from "./core"
export * from './types'
export * from './core'
export * from './components'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { VNodeType, PropsExtended } from "./types"
import { TestComponent } from "./components/test-component"
import { StackPanel } from "./components/stack-panel"
import { TestRepeater } from "./components/test-container"

if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", async () => {
		document.title = `Somatic generators `

		await renderApp()
	})
}

async function renderApp() {
	const Test = <TestRepeater key="container">
	</TestRepeater>

	const node = await core.render(Test)

	const rootNode = document.getElementById("root-div")
	if (rootNode) {
		// eslint-disable-next-line fp/no-loops
		while (rootNode.firstChild) {
			rootNode.removeChild(rootNode.firstChild)
		}
		rootNode.appendChild(node)
	}
}