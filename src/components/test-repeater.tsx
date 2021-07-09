/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { PropsExtended, Component, PanelProps, HtmlProps } from '../types'
import { TestComponent } from '../components/test-component'
import { FunctionComponent } from '../components/function_component'
type State = {
	internalTestComponents: boolean[],
	functionCompNumber?: number
}
export type Props = {

}

export const TestRepeater = makeComponent<Props>(async function* (props) {
	const state: State = {
		internalTestComponents: [true],
	}

	// eslint-disable-next-line fp/no-loops
	while (true) {
		yield <div style={{ border: " solid 1px gray", padding: "1em" }}>
			<div style={{ border: "solid 1px blue" }}><h3>Repeater component</h3></div>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutating-methods
				state.internalTestComponents.push(true)
				props.requireUpdate()
			}}>Add component</button>
			<button onClick={ev => {
				// eslint-disable-next-line fp/no-mutating-methods
				state.internalTestComponents.pop()
				props.requireUpdate()
			}}>Remove component</button>
			{
				state.internalTestComponents.map((v, i) => {
					return <TestComponent text={"Hohoho"} />
				})
			}
			<div style={{ border: "solid 1px orange", padding: "1em" }}>
				<h3>A function component after the repeated comps</h3>
				<input type="number"
					value={state.functionCompNumber}
					onKeyDown={ev => {
						state.functionCompNumber = parseFloat((ev.target as HTMLInputElement).value)
					}}
					onChange={ev => {
						state.functionCompNumber = parseFloat(ev.target.value)
						props.requireUpdate()
					}} />
				<FunctionComponent title={`Function comp`} num={state.functionCompNumber}>
				</FunctionComponent>
			</div>

		</div>
	}
}, {

})