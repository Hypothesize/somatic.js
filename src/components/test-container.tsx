/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, OptionalPropertyOf, Component, PanelProps, HtmlProps } from '../types'
import { TestComponent } from '../components/test-component'

export type Props = {

}

export const TestRepeater = async function* (props: PropsExtended<Props>, reRender: (key: string) => void) {
	const state = {
		internalTestComponents: [true],
	}

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.internalTestComponents.push(true)
				reRender(props.key || "")
			}}>Add a test component</button>
			{
				state.internalTestComponents.map((v, i) => {
					return <TestComponent text={"Hohoho"} key={`test_${i}`} />
				})
			}
		</div>
	}
} as unknown as (props: PropsExtended<Props>) => JSX.Element