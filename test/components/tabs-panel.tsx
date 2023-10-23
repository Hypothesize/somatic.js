import { hasValue } from '@sparkwave/standard'

import { createElement, } from '../../dist/core'
import { View, ViewProps } from './view'
import { StackPanel } from './stack-panel'
import { HtmlProps, Component, CSSProperties } from '../../dist/types'

export const TabsPanel: Component<Props> = async function* (props) {
	const { headers, headerItemStyle, headerItemTemplate, headerStyle, selectedHeaderItemStyle, selectedIndex, children, } = props
	const _selectedIndex = selectedIndex ?? 0

	const _children = (!hasValue(children)) ? [] : Array.isArray(children) ? children.flat() : [children]

	while (true) {
		yield <StackPanel orientation={"vertical"}>
			<View
				orientation={"horizontal"}
				sourceData={headers}
				itemStyle={headerItemStyle}
				selectedItemStyle={selectedHeaderItemStyle}
				itemsPanel={StackPanel}
				itemTemplate={headerItemTemplate}
			/>

			<div>{_children[_selectedIndex || 0]}</div>
		</StackPanel>
	}
}

export type Props<THeader = unknown> = HtmlProps & {
	headers: Array<THeader>
	headerStyle?: CSSProperties
	headerItemTemplate?: ViewProps<THeader>["itemTemplate"]
	headerItemStyle?: CSSProperties
	selectedHeaderItemStyle?: CSSProperties
	selectedIndex?: number
}

// TabsPanel.stateful = false
TabsPanel.isPure = true
TabsPanel.defaultProps = {
	selectedIndex: 0,
	selectedHeaderItemStyle: {
		fontWeight: "bold"
	}
}
