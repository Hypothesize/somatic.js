/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent, updateDOM } from '../core'
import { Component } from '../types'

export type Props<T extends unknown> = {
	key: string
	title?: string,
	model: T,
	list: T[]
}
export const TypedComponent = <T extends unknown = unknown>(outsideProps: Props<T>) => {
	const TypedPropsComp = makeComponent<Props<T>>(async function* (props) {
		const {
			title,
			model,
			list
		} = props

		// eslint-disable-next-line fp/no-loops
		while (true) {
			yield < div style={{ margin: "1em", background: "#ede" }}>
				<p>Model: {model}</p>
				<ul>List: {
					list.map(el => <li>{el}</li>)
				}</ul>
			</div>
		}
	}, {
		title: "Test component"
	})

	return <TypedPropsComp {...outsideProps} />
}
