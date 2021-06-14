/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, Component, PanelProps, HtmlProps } from '../types'
import { TestComponent } from '../components/test-component'

export type Props = {

}

export const TestRepeater = makeComponent<Props>(async function* (props) {
	const state = {
		internalTestComponents: [true],
	}

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.internalTestComponents.push(true)
				props.requireUpdate(props.key || "")
			}}>Add a test component</button>
			{
				state.internalTestComponents.map((v, i) => {
					return <TestComponent text={"Hohoho"} key={`test_${i}`} />
				})
			}
		</div>
	}
}, {

})