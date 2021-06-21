/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { Component } from '../types'

type Props<T extends unknown> = {
	key: string
	model: T,
}

type State<T> = {
	listItems: T[]
}

export const TypedComponent = <T extends unknown>(outsideProps: Props<T>): Component<Props<T>> => {
	const TypedComp = makeComponent<Props<T>>(async function* (props) {
		const {
			model
		} = props
		const state: State<T> = {
			listItems: []
		}
		// eslint-disable-next-line fp/no-loops
		while (true) {
			yield < div style={{ margin: "1em", background: "#ede" }}>
				<p>Add an element <button onClick={ev => {
					state.listItems.push(model)
					props.requireUpdate(props.key)
				}}>Click</button></p>
				<p>Model: {model}</p>
				<ul>List: {
					state.listItems.map(el => <li>{el}</li>)
				}</ul>
			</div>
		}
	}, {
		title: "Test component"
	})

	return <TypedComp {...outsideProps} />
}
