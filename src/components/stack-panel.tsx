/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeAsyncFunctionComponent } from '../core'
import { PanelProps, HtmlProps } from '../types'

export type Props = PanelProps & HtmlProps & {
	key?: string
}

export const StackPanel = makeAsyncFunctionComponent<Props>(async function (props) {
	const alignItems = () => {
		switch (props.orientation === "vertical" ? (props.itemsAlignH) : (props.itemsAlignV)) {
			case "start":
				return "flex-start"
			case "end":
				return "flex-end"
			case "center":
				return "center"
			case "stretch":
				return "stretch"
			default:
				return "initial"
		}
	}
	const justifyContent = () => {
		switch (props.orientation === "vertical" ? (props.itemsAlignV) : (props.itemsAlignH)) {
			case "start":
				return "flex-start"
			case "end":
				return "flex-end"
			case "center":
				return "center"
			case "uniform":
				return "space-between"
			default:
				return "initial"
		}
	}
	const {
		orientation,
		itemsAlignH,
		itemsAlignV,
		children,
		style,
		key,
		...htmlProps
	} = props
	// eslint-disable-next-line fp/no-loops
	return <div
		{...htmlProps}
		style={{
			display: "flex",
			...style,
			flexDirection: orientation === "vertical" ? "column" : "row",
			justifyContent: justifyContent(),
			alignItems: alignItems()
		}}>
		{children}
	</div >

})