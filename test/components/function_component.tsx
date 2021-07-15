/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createElement, makeComponent } from '../../src/core'
import { StackPanel } from '../../src/components/stack-panel'

export const enum BtnMode { Normal = "normal", Selected = "selected", Disabled = "disabled" }

type Props = {
	num?: number
	title: string
}
// eslint-disable-next-line @typescript-eslint/ban-types

export const FunctionComponent = makeComponent<Props>(function (props) {
	const {
		num,
		title
	} = props

	const mainContent = <StackPanel key="funcComponent" style={{ background: "whitesmoke" }}>
		<h3>{title}</h3>
		<p>Props "num" (default: 5) equals {num}</p>
	</StackPanel>

	return <div className="Check">{mainContent}</div>
}, {
	stateful: false,
	isPure: true,
	defaultProps: {
		num: 5
	}
})