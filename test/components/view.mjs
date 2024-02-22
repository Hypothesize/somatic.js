//@ts-check

import { default as cuid } from "cuid"

import { createElement, invalidateUI } from '../../dist/core.js'
import { StackPanel } from './stack-panel.mjs'

// export type ViewProps<T = unknown> = HtmlProps & PanelProps & {
// 	sourceData: Iterable<T>
// 	selectedIndex?: number,
// 	itemsPanel: Component<HtmlProps & PanelProps>,
// 	itemTemplate?: Component<{ value: T, index: number, selected?: boolean/*, children?: never[]*/ }>
// 	itemStyle?: CSSProperties,
// 	selectedItemStyle?: CSSProperties
// 	children?: never[]
// 	selectionEnabled?: boolean
// 	onSelection?: (eventData: { selectedIndex: number }) => void
// }
// export async function* View<T extends Children | undefined>(props: ArgsType<Component<ViewProps<T>>>[0]): AsyncGenerator<JSX.Element, JSX.Element, typeof props> {
// 	const defaultProps = {
// 		id: cuid(),
// 		selectedIndex: 0,
// 		itemsPanel: StackPanel,
// 		itemTemplate: (p => <div>{p.value}</div>) as Required<ViewProps<T>>["itemTemplate"],
// 		itemStyle: {} as CSSProperties,
// 		selectedItemStyle: {} as CSSProperties,
// 		selectionEnabled: true,
// 	}

// 	try {
// 		while (true) {
// 			let {
// 				id,
// 				style,
// 				children, // children will be ignored, should be undefined
// 				sourceData,
// 				// itemTemplate: ItemTemplate,
// 				itemsPanel: ItemsPanel,
// 				itemStyle,
// 				selectedItemStyle,
// 				selectedIndex,
// 				selectionEnabled,
// 				onSelection,
// 				...restOfProps
// 			} = Object.assign({ ...defaultProps, ...props })

// 			const ItemTemplate = props.itemTemplate ?? defaultProps.itemTemplate

// 			// Yield the current UI, and also updating props with any new injected props
// 			props = (yield <ItemsPanel id={id} style={style} {...restOfProps}>
// 				{
// 					[...sourceData].map((item, index) =>
// 						<div
// 							id={`${id}_item_container_${index}`} // Pre-pend parent id so that child ids are globally unique
// 							style={{ ...itemStyle, ...index === selectedIndex ? selectedItemStyle : {} }}
// 							onClick={ev => {
// 								if (selectionEnabled) {
// 									// const oldSelectedIndex = selectedIndex
// 									selectedIndex = index
// 									if (onSelection) {
// 										onSelection({ selectedIndex })
// 									}
// 									invalidateUI([id])
// 								}
// 							}}>

// 							{<ItemTemplate value={item} index={index} selected={index === selectedIndex} />}
// 						</div>
// 					)
// 				}
// 			</ItemsPanel >) ?? props // So that props is not overwritten with undefined in case none were injected
// 		}
// 	}
// 	catch (e) {
// 		console.error(`View render: ${e}`)
// 		throw e
// 	}
// }


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
export const View = async function* (props) {
	const defaultProps = {
		id: cuid(),
		selectedIndex: 0,
		itemsPanel: StackPanel,
		itemTemplate: p => createElement('div', null, p.value),
		itemStyle: {},
		selectedItemStyle: {},
		selectionEnabled: true,
	};

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
			} = Object.assign({ ...defaultProps, ...props });

			const ItemTemplate = props.itemTemplate ?? defaultProps.itemTemplate;

			props = yield createElement(ItemsPanel, { id, style, ...restOfProps },
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
			) || props;
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


