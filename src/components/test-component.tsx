/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, OptionalPropertyOf, Component, PanelProps, HtmlProps } from '../types'

export type Props = {
	color?: string,
	text: string
}

const defaultProps: Pick<Props, OptionalPropertyOf<Props>> = {
	color: "Green"
}

export const TestComponent = async function* (props: PropsExtended<Props>, reRender: (key: string) => void) {
	const { text, color } = { ...defaultProps, ...props }
	const state = {
		internalNumber: 0,
		color: defaultProps.color
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
				reRender(props.key || "")
			}}>TRY</button>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.color = "Red"
				reRender(props.key || "")
			}}>Assign state color to red</button>
			<p>State color: {state.color}</p>
		</div>
	}
} as unknown as (props: PropsExtended<Props>) => JSX.Element