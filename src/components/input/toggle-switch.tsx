/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, mergeProps } from '../../core'
import { Component, ComponentProps, CSSProperties, Icon } from '../../types'
import { HoverBox } from '../boxes/hover-box'
import { StackPanel } from '../panels/stack-panel'

/** Defines properties for each option */
export interface Option {
	label: string
	tooltip?: string
	icon?: Icon
	isDisabled?: boolean,
	customElement?: JSX.Element
	style?: CSSProperties
}

type Props = ComponentProps.Html & {
	/** Array of option objects */
	choices: Option[]

	/** Defines the selected option using the index of the array */
	selectedSwitchIndex: number

	/** Style of the switch */
	style?: CSSProperties

	/** "on-off" will show only the selected label, "multiple-choices" shows all the labels, the selected is highlighted */
	type?: "on-off" | "multiple-choices"
}

export const defaultProps = {
	options: [],
	selectedSwitchIndex: 0,
	style: { height: "40px" },
	type: "multiple-choices" as const
}

type Messages = ({ type: "SWITCH_CHANGE", data: { index: number } })

export const ToggleSwitch: Component<Props, Messages> = (props) => {
	const { type, choices, style, selectedSwitchIndex, postMsgAsync } = mergeProps(defaultProps, props)
	const sliderWidth = style.height
	// const borderColor = colorLuminance(config.theme.colors.whitish, -0.1)

	return <StackPanel orientation={"horizontal"} style={{ height: "100%", ...props.style }}>
		{
			props.choices.map((option, index) => {
				const IconItem = option.icon
				const border = selectedSwitchIndex === index
					? `2px solid`
					: `thin solid`

				return <HoverBox
					style={{
						backgroundColor: "white",
						color: props.selectedSwitchIndex === index
							? 'white'
							: "black",
						height: "100%",
						flex: "1"
					}}
					hoverStyle={{
						backgroundColor: option.isDisabled !== true
							? "whitesmoke"
							: "inherit",
						borderColor: props.style && props.style.borderColor
					}}>

					<StackPanel
						title={option.tooltip}
						itemsAlignV={"center"}
						style={{
							cursor: option.isDisabled !== true ? "pointer" : "inherit",
							borderRight: selectedSwitchIndex === index + 1
								? `2px solid`
								: border
							,
							borderTop: border,
							borderBottom: border,
							// ...props.selectedSwitchIndex === index && { boxShadow: "inset 0 0 2px #333" },
							...index === 0
							&& { borderLeft: border, borderRadius: "0.3rem 0 0 0.3rem" },
							...index === props.choices.length - 1
							&& { borderRadius: "0 0.3rem 0.3rem 0" },
							...option.style,

						}}
						onClick={() => {
							if (props.postMsgAsync && option.isDisabled !== true)
								props.postMsgAsync({
									type: "SWITCH_CHANGE",
									data: {
										index: index
									}
								})
						}}>
						{
							option.customElement
								? <StackPanel
									style={{
										height: '100%',
										width: "100%",
										margin: "auto"
									}}
									itemsAlignV={"center"}
									itemsAlignH={"center"}>
									{option.customElement}
								</StackPanel>
								: <StackPanel
									style={{ height: '100%', width: "100%", margin: "auto", }}
									itemsAlignV={"center"}
									itemsAlignH={"center"}>
									{IconItem && <IconItem style={{}} />}
									{option.label}
								</StackPanel>
						}
					</StackPanel>
				</HoverBox>
			})
		}

	</StackPanel>
}