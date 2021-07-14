/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, Component, PanelProps, VNode, VNodeType } from '../types'
import { TestComponent } from '../components/test-component'
type State = {
	presenceOfFirst: boolean,
}
export type Props = {

}

export const FixedOrderComp: Component<Props> = makeComponent<Props>(async function* (props) {
	const state: State = {
		presenceOfFirst: true,
	}

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div style={{ border: " solid 1px gray", padding: "1em" }}>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutation
				state.presenceOfFirst = !state.presenceOfFirst
				props.requireUpdate()
			}}>Remove first elem from DOM</button>
			{
				state.presenceOfFirst
					? <TestComponent title={"Removable"} />
					: null
			}
			<TestComponent title={"Ever present"} />
		</div>
	}
}, {
	stateful: true
})