//@ts-check

import { hasValue } from '@sparkwave/standard'

import { createElement } from '../../dist/core.js'
import { StackPanel } from './stack-panel.mjs'
import { View } from './view.mjs'

/** Props
 * @typedef {{
 *    headers: Array<string>;
 *    headerStyle?: import('../../dist').CSSProperties;
 *    headerItemTemplate?: import('./view.js').ViewProps["itemTemplate"];
 *    headerItemStyle?: import('../../dist').CSSProperties;
 *    selectedHeaderItemStyle?: import('../../dist').CSSProperties;
 *    selectedIndex?: number;
 * } & import('../../dist').HtmlProps } Props
*/

/** @type { import('../../dist').Component<Props> } */
export const TabsPanel = (props) => {
	const { headers, headerItemStyle, headerItemTemplate, headerStyle, selectedHeaderItemStyle, selectedIndex, children } = props;
	const _selectedIndex = selectedIndex ?? 0;

	const _children = !hasValue(children) ? [] : Array.isArray(children) ? children.flat() : [children];

	while (true) {
		return createElement(StackPanel, { orientation: "vertical" },
			createElement(View, {
				orientation: "horizontal",
				sourceData: headers,
				itemStyle: headerItemStyle,
				selectedItemStyle: selectedHeaderItemStyle,
				itemsPanel: StackPanel,
				itemTemplate: headerItemTemplate
			}),
			createElement('div', {}, _children[_selectedIndex || 0])
		);
	}
}

TabsPanel.isPure = true;
TabsPanel.defaultProps = {
	selectedIndex: 0,
	selectedHeaderItemStyle: {
		fontWeight: "bold"
	}
}