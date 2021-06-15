/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'

export type Props = {
	color?: string,
	text: string
}

export const TestComponent = makeComponent<Props>(async function* (props) {
	console.log(props.color)
	const {
		text,
		color
	} = props
	const state = {
		internalNumber: 0,
		color: props.color
	}

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div>
			<h1>SUCCESS</h1>
			<p>Text props: {text}</p>
			<p>Color props: {color}</p>
			<p>Internal number: {state.internalNumber}</p>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.internalNumber++
				props.requireUpdate(props.key || "")
			}}>TRY</button>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.color = "Red"
				props.requireUpdate(props.key || "")
			}}>Assign state color to red</button>
			<p>State color: {state.color}</p>
		</div>
	}
}, {
	color: "Green"
})