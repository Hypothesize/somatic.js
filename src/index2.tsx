/* eslint-disable @typescript-eslint/no-namespace */
import * as core from './core'
import { createElement } from "./core"
export * from './types'
export * from './core'
export * from './components'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TestRepeater } from "./components/test-repeater"
import { FixedOrderComp } from "./components/fixed-order"
import { TypedComponent } from "./components/typed-component"

if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", async () => {
		document.title = `Somatic generators `

		await renderApp()
	})
}

async function renderApp() {
	const Test = <div>
		<h1>Basic {"<h1>"}</h1>
		<TestRepeater key="repeater">
		</TestRepeater>
		<FixedOrderComp key="orderComp" />
		<TypedComponent key="TypedComp" model={56} />
	</div>

	const node = await core.render(Test, "")

	const rootNode = document.getElementById("root-div")
	if (rootNode) {
		// eslint-disable-next-line fp/no-loops
		while (rootNode.firstChild) {
			rootNode.removeChild(rootNode.firstChild)
		}
		rootNode.appendChild(node)
	}
}