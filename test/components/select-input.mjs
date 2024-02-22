//@ts-check

import { assert } from 'console';
import { createElement } from '../../dist/core.js'

/** @typedef {{ type: "SELECTION", data: number }} Messages */
/** @typedef {{ label: string, options: (string | number)[] }} OptionsGrouped */

/** Props for SelectInput component.
 * @typedef {Object} Props
 * @property {number} selectedIndex Index of selected value by default will be 0.
 * @property {(string[] | OptionsGrouped[])} options Options can be passed as an array of strings or can be passed as an array of objects that group other options.
 * @property {number[]} [disabledIndexes] Array of the indexes that can't be selected.
 * @property {string[]} [descriptions] Optional info that will be shown as a tooltip for each option.
 * @property {string} [name] Name property for the select HTML element.
*/

/** @type { import('../../dist').Component<Props & import('../../dist/types.js').HtmlProps> } */
export const SelectInput = (props) => {
	const {
		options,
		selectedIndex,
		style,
		children
	} = props;

	const getCurrentValue = () => {
		if (options.length > 0 && typeof options[0] !== "string") {
			/** @type { any[]} */
			const seed = []
			const reducedOptions = options.reduce((arr, curr) => {
				if (typeof curr === "string") throw `Options array should not contain strings when using OptionsGrouped type.`
				return [...arr, ...curr.options]
			}, seed)
			return reducedOptions[selectedIndex]
		}
		else {
			return options[selectedIndex]
		}
	};
	const currentValue = getCurrentValue();

	return createElement(
		"select",
		{
			defaultValue: props.defaultValue,
			name: props.name,
			style: {
				height: "1.5rem",
				...style,
				background: "white",
				color: props.disabledIndexes && props.disabledIndexes.indexOf(selectedIndex || 0) !== -1 ? "gray" : "black"
			},
			onClick: e => e.stopPropagation(),
			onChange: e => { },
			value: props.selectedIndex ? currentValue : undefined
		},
		options.length > 0 && typeof options[0] !== "string"
			? options.map(obj => createElement(
				"optgroup",
				{ label: obj.label },
				obj.options.map(data => createElement("option", { value: data.toString() }, data))
			))
			: (children && Array.isArray(children) && children.length > 0
				? children
				: options).map((child, index) => createElement(
					"option",
					{
						style: { color: props.disabledIndexes && props.disabledIndexes.indexOf(index) !== -1 ? "gray" : "black" },
						disabled: props.disabledIndexes && props.disabledIndexes.indexOf(index) !== -1,
						value: child.toString(),
						title: props.descriptions ? props.descriptions[index] : undefined,
						selected: index === selectedIndex
					},
					child.toString()
				))
	);
};

SelectInput.isPure = true;
SelectInput.defaultProps = {
	style: {
		backgroundColor: "white",
		background: "white"
	}
};