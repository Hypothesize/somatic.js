//@ts-check

import { default as cuid } from 'cuid'
import { createElement, stringifyStyle, getChildren, normalizeChildren, isEltProper } from '../../dist/index.js'

/** @typedef { import('../../dist').HtmlProps & {hoverStyle?: import('../../dist').CSSProperties}} HoverBoxProps */

/** @type { import('../../dist').Component<HoverBoxProps> } */
export const HoverBox = function (props) {
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
				onMouseEnter: (e) => {
					// if (postMsgAsync)
					// 	postMsgAsync({ type: "HOVER_START" })
				},
				onMouseLeave: (e) => {
					// if (postMsgAsync)
					// 	postMsgAsync({ type: "HOVER_STOP" })
				}
			}
		}
	}
	else {
		child = createElement("div", { ...htmlProps, className: className__ }, child)
	}

	return createElement('div', { style: { display: "inline" } },
		createElement('style', {}, `
		.${className__} {
			${stringifyStyle({ ...style }, true)}
		}
		.${className__}:hover {
			${stringifyStyle({ ...hoverStyle }, true)}
		}					
		input[type="text"].${className__} {
			${stringifyStyle({ backgroundColor: "#fff", }, true)}
		}`),

		child
	)
}

HoverBox.isPure = true
HoverBox.defaultProps = {
	/** @type { import('../../dist').CSSProperties } */
	style: {
		height: "auto",
		width: "auto",
		padding: 0,
		margin: 0
	},
	hoverStyle: {}
}

