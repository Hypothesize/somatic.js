/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { deepMerge, } from '@sparkwave/standard/collections/object'

import { StackView } from './stack-view'
import { StackPanel } from './stack-panel'
import { PropsExtended, CSSProperties, HtmlProps, ViewProps } from '../types'
import { createElement, makeAsyncFunctionComponent } from '../core'


export type Messages = (
	{ type: "selection", data: string }
)

export type Props = {
	headers: ViewProps<string>
	selectedIndex?: number
	selectedItemStyle?: CSSProperties
}

export const TabsPanel = makeAsyncFunctionComponent<PropsExtended<Props, Messages>>(async (props) => {

	const {
		headers,
		selectedIndex,
		selectedItemStyle,

		children,
		postMsgAsync
	} = props


	return <StackPanel orientation={"vertical"}>
		<StackView
			orientation={"horizontal"}
			sourceData={headers.sourceData}
			itemStyle={headers.itemStyle}
			selectedItemStyle={selectedItemStyle}
			itemTemplate={headers.itemTemplate}
			postMsgAsync={async msg => {
				postMsgAsync({
					type: "selection",
					data: [...headers.sourceData][msg.data]
				})
			}}
			selectedItemIndex={selectedIndex}>

		</StackView>

		<div>
			{(children ?? [])[selectedIndex]}
		</div>
	</StackPanel>
}, {
	selectedIndex: 0,
	selectedItemStyle: {
		fontWeight: "bold"
	},
	postMsgAsync: async (msg: Messages) => ""
})
