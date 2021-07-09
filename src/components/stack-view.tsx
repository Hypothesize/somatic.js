import { createElement, makeFunctionComponent } from '../core'
import { CSSProperties, PropsExtended, PanelProps, ViewProps, FunctionComponent } from '../types'
import { StackPanel } from './index'

export type Messages = (
	{ type: "selection", data: number }
)

export type Props<T = unknown> = PanelProps & ViewProps<T> & {
	selectedItemIndex: number,
	selectedItemStyle?: CSSProperties,
	style?: CSSProperties
}
export const StackView = <T extends unknown>(outsideProps: PropsExtended<Props<T>, Messages>) => {
	return makeFunctionComponent<PropsExtended<Props<T>, Messages>>(function (props) {
		try {
			const {
				sourceData,
				selectedItemIndex,
				itemTemplate,
				itemStyle,
				selectedItemStyle,
				postMsgAsync,
				...restOfProps
			} = props

			return <StackPanel {...restOfProps}>
				{
					[...sourceData]
						.map((item, index) =>
							<div
								style={{ ...itemStyle, ...index === selectedItemIndex ? selectedItemStyle : {} }}
								onClick={(e) => {
									return postMsgAsync
										? postMsgAsync({ type: "selection", data: index })
										: undefined
								}}>

								{itemTemplate
									? itemTemplate({ item, index })
									: item
								}
							</div>
						)
				}

			</StackPanel >
		}
		catch (e) {
			console.error(`StackView render: ${e}`)
			throw e
		}
	}, {
		isPure: true
	}, {
		selectedItemStyle: {} as CSSProperties,
		itemStyle: {}
	})(outsideProps)
}