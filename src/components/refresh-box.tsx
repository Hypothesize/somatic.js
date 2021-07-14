/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent } from '../core'

export const RefreshBox = makeComponent(async function* (props) {
	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div style={{ border: " solid 1px gray", padding: "1em" }}>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				props.requireUpdate()
			}}>Re-render</button>
			{props.children}
		</div>
	}
}, {
	stateful: true
})