/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createElement, makeAsyncFunctionComponent } from '../core'
import { Component, HtmlProps, PanelProps, ExtractOptional, OptionalKeys } from '../types'
import { StackPanel } from './stack-panel'

export const enum BtnMode { Normal = "normal", Selected = "selected", Disabled = "disabled" }

type Props = {
	/** Icon component to be placed next/before the title of the button */
	icon?: JSX.Element

	/** Relative postion of the icon in relationship with the title */
	iconPlacement?: "before" | "after"

	/** Orientation for the container of the children */
	orientation?: PanelProps["orientation"]
}
// eslint-disable-next-line @typescript-eslint/ban-types

export const FunctionComponent = makeAsyncFunctionComponent<Props>(async function (props) {
	const {
		orientation,
	} = props

	const iconContent = props.icon
		? props.icon
		: <div />

	const mainContent = <StackPanel key="main-content">
		<h1>Function component</h1>
	</StackPanel>

	return <div>{mainContent}</div>
}, {
	orientation: "horizontal"
})