import * as cuid from 'cuid'
import { deepMerge, first } from '@sparkwave/standard'
import { createElement } from '../../dist/core'
import { stringifyStyle } from '../../dist/html'
import { getChildren, normalizeChildren, isEltProper } from '../../dist/element'
import { Component, CSSProperties, HtmlProps } from '../../dist/types'

export type HoverBoxProps = HtmlProps & {
	hoverStyle?: CSSProperties
}

export const HoverBox: Component<HoverBoxProps> = props => {
	const {
		children,
		hoverStyle,
		style,
		...htmlProps
	} = props

	const className__ = cuid()

	let child = normalizeChildren(children)[0]
	if (isEltProper(child)) {
		child = {
			...child,
			props: {
				...child.props,
				className: className__,
				style: child.props.style ?? {},
				onMouseEnter: (e: unknown) => {
					// if (postMsgAsync)
					// 	postMsgAsync({ type: "HOVER_START" })
				},
				onMouseLeave: (e: unknown) => {
					// if (postMsgAsync)
					// 	postMsgAsync({ type: "HOVER_STOP" })
				}
			}
		}
	}
	else {
		child = <div {...htmlProps} className={className__}>{child}</div>
	}

	return <div style={{ display: "inline" }}>
		<style>
			{`
				.${className__} {
					${stringifyStyle({ ...style }, true)}
				}
				.${className__}:hover {
					${stringifyStyle({ ...hoverStyle }, true)}
				}					
				input[type="text"].${className__} {
					${stringifyStyle({ backgroundColor: "#fff", }, true)}
				}
			`}
		</style>

		{child}
	</div>
}

HoverBox.isPure = true
HoverBox.defaultProps = {
	style: {
		height: "auto",
		width: "auto",
		padding: 0,
		margin: 0
	} as CSSProperties,
	hoverStyle: {}
}

