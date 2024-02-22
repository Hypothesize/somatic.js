//@ts-check

import { default as cuid } from "cuid"

import { createElement, invalidateUI } from '../../dist/core.js'
import { StackPanel } from './stack-panel.mjs'


/** ViewProps
	* @typedef {{
	*	sourceData: Iterable;
	*	selectedIndex?: number,
	*	itemsPanel: import("../../dist").Component<import("../../dist").HtmlProps & import("../../dist").PanelProps>,
	*	itemTemplate?: import("../../dist").Component<{ value: any, index: number, selected?: boolean }>
	*	itemStyle?: import("../../dist").CSSProperties,
	*	selectedItemStyle?: import("../../dist").CSSProperties
	*	children?: never[]
	*	selectionEnabled?: boolean
	*	onSelection?: (eventData: { selectedIndex: number }) => void
	* }} ViewProps
*/

/** @type {import("../../dist").ComponentAsyncStateful<ViewProps & import("../../dist").HtmlProps & import("../../dist").PanelProps> } */
export const View = async function* (_props) {
	const defaultProps = {
		id: cuid(),
		selectedIndex: 0,
		itemsPanel: StackPanel,
		itemTemplate: p => createElement('div', {}, p.value),
		itemStyle: {},
		selectedItemStyle: {},
		selectionEnabled: true,
	}
	let props = { ...defaultProps, ..._props }

	try {
		while (true) {
			let {
				id,
				style,
				children,
				sourceData,
				itemsPanel: ItemsPanel,
				itemStyle,
				selectedItemStyle,
				selectedIndex,
				selectionEnabled,
				onSelection,
				...restOfProps
			} = props

			const ItemTemplate = props?.itemTemplate ?? defaultProps.itemTemplate

			const newProps = yield createElement(ItemsPanel, { id, style, ...restOfProps },
				[...sourceData].map((item, index) =>
					createElement(
						'div',
						{
							id: `${id}_item_container_${index}`,
							style: { ...itemStyle, ...(index === selectedIndex ? selectedItemStyle : {}) },
							onClick: ev => {
								if (selectionEnabled) {
									selectedIndex = index;
									if (onSelection) {
										onSelection({ selectedIndex });
									}
									invalidateUI([id]);
								}
							}
						},
						createElement(ItemTemplate, { value: item, index, selected: index === selectedIndex })
					)
				)
			)
			props = { ...props, ...newProps }
		}
	}
	catch (e) {
		console.error(`View render: ${e}`);
		throw e;
	}
}

// this should succeed type-checking
// const elt1 = <View sourceData={[1, 2, 3]} itemsPanel={StackPanel}></View>

// this should fail type-checking because the View component does not accept children
// const elt2 = <View sourceData={[1, 2, 3]} itemsPanel={StackPanel}><div /></View>


