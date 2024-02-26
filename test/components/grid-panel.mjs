//@ts-check

import { isArray } from '@sparkwave/standard/utility.js'

import { createElement } from '../../dist/core.js'

/** @typedef {('none' | 'auto' | 'max-content' | 'min-content' | 'initial' | 'inherit' | import('../../dist/types.js').CSSLength)} RowOrColumnInfo */

/**
 * @typedef {Object} GridPanelProps
 * @augments {PanelProps}
 * @augments {HtmlProps}
 * @property {(number|RowOrColumnInfo[])} [rows] - The number of rows or row configuration.
 * @property {(number|RowOrColumnInfo[])} [cols] - The number of columns or column configuration.
 * @property {(CSSLength|{row?: CSSLength, column?: CSSLength})} [gap] - The gap between rows and columns.
 */

/** @type { import('../../dist/types.js').Component<GridPanelProps> } */
export const GridPanel = function (props) {
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
		orientation, itemsAlignH, itemsAlignV, children,
		rows, cols, gap,
		style, ...htmlProps
	} = props

	return createElement(
		'div',
		{
			...htmlProps,
			style: {
				...style,
				gridTemplateRows: isArray(rows) ? rows.join(' ') : (rows?.toString() ?? 'unset'),
				gridTemplateColumns: isArray(cols) ? cols.join(' ') : (cols?.toString() ?? 'unset'),
				...(typeof gap === 'string' || typeof gap === 'number'
					? { gap }
					: { rowGap: gap?.row ?? 'unset', columnGap: gap?.column ?? 'unset' }),
				display: 'grid',
				flexDirection: orientation === 'vertical' ? 'column' : 'row',
				justifyContent: justifyContent(),
				alignItems: alignItems()
			}
		},
		children
	)


}

GridPanel.isPure = true


// const elt = createElement(StackPanel, { itemsAlignH: "stretch", x: 1 }, createElement("div", {}))
// const elt1 = createElement(StackPanel, { itemsAlignHX: "stretch" }, createElement("div", {}))
// const x = <div />
// const y = <StackPanel />