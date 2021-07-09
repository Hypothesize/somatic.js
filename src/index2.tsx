/* eslint-disable @typescript-eslint/no-namespace */
import * as core from './core'
import { createElement, startRenderingLoop } from "./core"
export * from './types'
export * from './core'
export * from './components'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TestRepeater } from "./components/test-repeater"
import { FixedOrderComp } from "./components/fixed-order"
import { TypedComponent } from "./components/typed-component"
import { ImpureTimeComponent } from "./components/impure-time-component"
import { PureTimeComponent } from "./components/pure-time-component"
import { RefreshBox } from "./components/refresh-box"

if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", async () => {
		// eslint-disable-next-line fp/no-mutation
		document.title = `Somatic generators `

		await renderApp()
	})
}

async function renderApp() {
	const Test = <div>
		<div style={{ /** LEFT SIDE */
			width: "50%",
			display: "inline-block",
			verticalAlign: "top"
		}}>
			<h1>A basic {"<h1>"} element</h1>
			<TestRepeater>
			</TestRepeater>
			<FixedOrderComp key="customKey" />
			<TypedComponent model={56} />
		</div>
		<div style={{ /** RIGHT SIDE */
			width: "50%",
			display: "inline-block",
			verticalAlign: "top"
		}}>
			<h3>Non-pure Time component (should be refreshed at every re-render)</h3>
			<RefreshBox>
				<ImpureTimeComponent />
			</RefreshBox>

			<h3>Pure time component (should not be refreshed at every re-render)</h3>
			<RefreshBox>
				<PureTimeComponent />
			</RefreshBox>
		</div>

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
	startRenderingLoop()
}