/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, Component, VNode, PanelProps, HtmlProps } from '../types'

export type Props = {
	color?: string,
	text?: string
}
type State = {
	internalNumber: number
}

export const TestComponent = async function* (props: PropsExtended<Props>, reRender: (key: string) => void) {
	const { text, color } = props
	// eslint-disable-next-line fp/no-let
	let internalNumber = 0

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div>
			<h1>SUCCESS</h1>
			<p>Text props: {text}</p>
			<p>Color props: {color}</p>
			<p>Internal number: {internalNumber}</p>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				internalNumber++
				reRender(props.key || "")
			}}>TRY</button>
		</div>
	}
}