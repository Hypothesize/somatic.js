/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent } from '../core'
import { PropsExtended } from '../types'

type Props = {
	color?: string,
	text: string
}

export const TestComponent = makeComponent<PropsExtended<Props>>(async function* (props) {
	const { text, color } = props
	// eslint-disable-next-line fp/no-let
	let internalNumber = 0

	yield <div>
		<h1>SUCCESS</h1>
		<p>Text props: {text}</p>
		<p>Color props: {color}</p>
		<p>Internal number: {internalNumber}</p>
		<button onClick={ev => {
			// eslint-disable-next-line fp/no-mutation
			internalNumber++
		}}>TRY</button>
	</div>
}, {
	defaultProps: { color: "Blue" }
})