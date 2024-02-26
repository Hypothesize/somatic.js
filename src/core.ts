const nanomorph = require('nanomorph')
import { default as assert } from "assert"

import { String as String__, hasValue, flatten } from "@sparkwave/standard"
import { stringifyAttributes } from "./html"
import { createDOMShallow, isTextDOM, isAugmentedDOM } from "./dom"
import { isFragmentElt, isComponentElt, isIntrinsicElt, isEltProper, getChildren, getLeafAsync, traceToLeafAsync, updateTraceAsync } from "./element"
import { Component, DOMElement, UIElement, ValueElement, IntrinsicElement, DOMAugmented } from "./types"
import { selfClosingTags } from "./common"

export const Fragment = ""
export type Fragment = typeof Fragment

/** JSX is transformed into calls of this function */
export function createElement<T extends string | Component>(type: T, props: (typeof type) extends Component<infer P> ? P : unknown, ...children: number[]) {
	return { type, props: props ?? {}, children: [...flatten(children)] }
}

/**
 * Render a UI element into a DOM node (augmented with information used for subsequent updates)
 * @param hierarchicalKey A string passed if outside information is needed to make it unique (i.e. in a list)
 */
export async function renderAsync(elt: UIElement, hierarchicalKey?: string): Promise<(DOMAugmented | DocumentFragment | Text)> {
	if (hasValue(elt)
		&& typeof elt === "object"
		&& "props" in elt &&
		"children" in elt &&
		typeof elt.type === "undefined") {
		console.warn(`Object appearing to represent proper element has no type member\n
			This is likely an error arising from creating an element with an undefined component`)
		// return createDOMShallow(JSON.stringify(elt)) as Text
	}
	console.log(`renderAsync: elt ${JSON.stringify(elt)}, hierarchicalKey ${hierarchicalKey}`)

	let customKey: string | undefined = undefined

	// We assign a key automatically, unless one was passed in the component's props.
	if (isComponentElt(elt)) {
		console.log(`renderAsync: isComponentElt ${JSON.stringify(elt)}`)
		customKey = elt.props.key as string | undefined

		/** The uniqueKeyAttribute will be used by Somatic to retrieve this element in the DOM */
		const uniqueKeyAttribute = hierarchicalKey !== undefined
			? hierarchicalKey // If a hierarchical key was passed (should be the case for any child component), we use it
			: customKey !== undefined
				? customKey // If the element has no hierarchical key passed (it's a root element) but has a custom key, we use it
				: elt.type.name // Otherwise, we default to the component name

		// TODO: See if the assignment of elt.type.name is not unnecessary
		elt.props = {
			...elt.props,
			uniqueKey: uniqueKeyAttribute
		}

		console.log(`renderAsync: hierarchicalKey key ${hierarchicalKey}`)
		console.log(`renderAsync: assigned key ${elt.props.key}`)
	}
	else if (isIntrinsicElt(elt)) {
		elt.props = {
			...elt.props,
			uniqueKey: hierarchicalKey !== undefined ? hierarchicalKey : elt.type
		}
		console.log(`renderAsync: Intrinsic element assigned key ${elt.props.key}`)
	}

	const trace = await traceToLeafAsync(elt)
	const leaf = trace.leafElement
	const dom = createDOMShallow(leaf)

	if (!isTextDOM(dom)) {
		// assert("uniqueKey" in dom, `no uniqueKey in dom: ${JSON.stringify(dom)}`)
		await populateWithChildren(dom, getChildren(leaf))
		return dom instanceof DocumentFragment
			? dom
			: Object.assign(dom, { renderTrace: trace, customKey: customKey })
	}
	else {
		return dom
	}
}

/** Render a UI element into a tree of intrinsic elements, optionally injecting some props in the root element */
export async function renderToIntrinsicAsync(elt: UIElement/*, injectedProps?: Obj*/): Promise<IntrinsicElement | ValueElement> {
	if (hasValue(elt) && typeof elt === "object" && "props" in elt && "children" in elt && typeof elt.type === "undefined") {
		console.warn(`Object appearing to represent proper element has no type member\nThis is likely an error due to creating an element with an undefined component`)
		return (elt)
	}

	const leaf = await getLeafAsync(elt)

	// console.log(`Leaf from render to intrinsic: ${JSON.stringify(leaf)}`)
	return (isIntrinsicElt(leaf))
		? {
			...leaf,
			// props: injectedProps ? mergeProps(leaf.props, injectedProps) : leaf.props,
			children: await Promise.all(getChildren(leaf).map(c => renderToIntrinsicAsync(c)))
		}

		: (leaf)
}

/** Render a UI element into its HTML string representation */
export async function renderToStringAsync(elt: UIElement): Promise<string> {
	if (hasValue(elt) && typeof elt === "object" && "props" in elt && "children" in elt && typeof elt.type === "undefined") {
		console.warn(`Object appearing to represent proper element has no type member\nThis is likely an error arising from creating an element with an undefined component`)
		return String(elt)
	}

	const trace = await traceToLeafAsync(elt)
	const leaf = trace.leafElement
	if (isIntrinsicElt(leaf)) {
		const children = getChildren(leaf)
		const attributesHtml = new String__(stringifyAttributes(leaf.props)).prependSpaceIfNotEmpty().toString()
		const childrenHtml = () => Promise.all(children.map(renderToStringAsync)).then(arr => arr.join(""))
		return hasValue(leaf.type)
			? selfClosingTags.includes(leaf.type.toUpperCase()) && children.length === 0
				? `<${leaf.type}${attributesHtml} />`
				: `<${leaf.type}${attributesHtml}>${await childrenHtml()}</${leaf.type}>`
			: `${await childrenHtml()}`

	}
	else {
		return String(leaf/* ?? ""*/)
	}
}

/** Update the rendering of an existing DOM element (because the data on which its rendering was based has changed)
 * @param dom The DOM element whose rendering is to be updated
 * @param elt A UI (JSX) element that is used as the overriding starting point of the re-render, if passed
 * @returns The updated DOM element, which is updated in-place
 */
export async function updateAsync(initialDOM: DOMAugmented/* | Text*/, elt?: UIElement) {
	if (isTextDOM(initialDOM)) {
		throw `UpdateAsync: Dom ${initialDOM} is text`
	}

	const newTrace = elt === undefined
		? await updateTraceAsync(initialDOM.renderTrace)
		: areCompatible(initialDOM, elt)
			? isComponentElt(elt)
				? await updateTraceAsync(initialDOM.renderTrace, elt)
				: { componentElts: [], leafElement: elt }
			: undefined

	if (newTrace) {
		if (isComponentElt(newTrace.leafElement) && isAugmentedDOM(initialDOM)) {
			newTrace.leafElement.props.uniqueKey = initialDOM.getAttribute("uniqueKey")
		}

		const updatedDOM = createDOMShallow(newTrace.leafElement)

		if (isIntrinsicElt(newTrace.leafElement) && !isTextDOM(updatedDOM)) {
			const _children = getChildren(newTrace.leafElement)
			await populateWithChildren(updatedDOM, _children)
		}
		return updatedDOM instanceof DocumentFragment
			? updatedDOM
			: Object.assign(updatedDOM, { renderTrace: newTrace })
	}
	else {
		if (elt === undefined /*|| elt === null*/) {
			throw `UpdateAsync: elt !== undefined`
		}

		console.log(`Creating a new element to replace the old one...`)
		const replacement = await renderAsync(elt)
		initialDOM.replaceWith(replacement)

		return initialDOM
	}
}

/** Update children of an DOM element and return it; has side effects */
export async function populateWithChildren(emptyElement: DOMElement | DocumentFragment, children: UIElement[]) {
	const flattenChildren = (_children: UIElement[]): UIElement[] => (_children
		.map(c =>
			isFragmentElt(c)
				? flattenChildren(getChildren(c))
				: c
		).flat()
	)

	const newDomChildren = await Promise.all(flattenChildren(children).map(async (child, i) => {
		// We assign a unique key, possibly reusing one that was passed in the props
		const parentPrefix = !isFragmentElt(emptyElement) ? getElementUniqueKey(emptyElement) : undefined
		console.log(`populateWithChildren: parentPrefixKey: ${parentPrefix}`)
		const hierachicalKey = getHierarchicalKey(child, parentPrefix, i)
		console.log(`populateWithChildren: hierchicalKey: ${hierachicalKey} for child ${JSON.stringify(child)}`)

		const matchingNode = isComponentElt(child)
			? document.querySelector(`[uniqueKey="${hierachicalKey}"]`) as DOMAugmented | undefined
			: undefined

		const updated = matchingNode
			? updateAsync(matchingNode, child)
			: renderAsync(child, hierachicalKey)

		updated.then(_ => {
			if (_ instanceof DocumentFragment && _.children.length === 0) {
				console.warn(`populateWithChildren: Returning empty doc fragment as dom for child ${JSON.stringify(child)}`)
			}
		})

		return updated
	}))

	// We insert the newDomChildren into the updatedDOM, in the same order as the domChildren
	emptyElement.append(...newDomChildren)
}

interface IUInvalidatedEvent extends Event {
	detail?: { invalidatedElementKeys: string[] }
}
/** Convenience method to mount the entry point dom node of a client app */
export async function mountElement(element: UIElement, container: Element) {
	/** Library-specific DOM update/refresh interval */
	document.addEventListener('UIInvalidated', invalidationHandler)

	container.replaceChildren(await renderAsync(element))
}

/** Invalidate UI */
export function invalidateUI(invalidatedElementKeys?: string[]/*, reason?: string */) {
	const ev = new CustomEvent('UIInvalidated', { detail: { invalidatedElementKeys } })
	if (document.readyState === "complete") {
		document.dispatchEvent(ev)
	}
	else {
		// console.log(`\ndocument.readyState: ${document.readyState}`)
		document.onreadystatechange = async _ => {
			// console.log(`\ndocument.readyState changed to: ${document.readyState}`)
			if (document.readyState === "complete") {
				console.log(`\nDispatching UIInvalidated event for ids "${ev.detail.invalidatedElementKeys}" after document loading complete\n`)
				document.dispatchEvent(ev)
			}
		}
	}
}

const invalidationHandler = (() => {
	let daemon: NodeJS.Timeout | undefined = undefined
	const invalidatedElementKeys: string[] = []

	return async function (eventInfo: IUInvalidatedEvent) {
		const DEFAULT_UPDATE_INTERVAL_MILLISECONDS = 14

		// console.log(`UIInvalidated fired with detail: ${stringify((eventInfo as any).detail)}`)
		const _invalidatedElementKeys: string[] = (eventInfo).detail?.invalidatedElementKeys ?? []
		invalidatedElementKeys.push(..._invalidatedElementKeys)
		if (daemon === undefined) {
			daemon = setInterval(async () => {
				if (invalidatedElementKeys.length === 0 && daemon) {
					clearInterval(daemon)
					daemon = undefined
				}
				const keysToProcess = invalidatedElementKeys.splice(0, invalidatedElementKeys.length)
				await Promise.all(keysToProcess.map(async key => {
					// console.log(`Updating "${id}" dom element...`)
					const elt = document.querySelector(`[uniqueKey="${key}"]`)
					if (elt) {
						const updatedElt = await updateAsync(elt as DOMAugmented) as HTMLElement
						nanomorph(elt, updatedElt)
						const childrenWithKeys = updatedElt.querySelectorAll("[uniqueKey]")
						await Promise.all([...childrenWithKeys, updatedElt].map(updatedElement => new Promise<void>(resolve => {
							const elKey = updatedElement.getAttribute("uniqueKey")
							if (elKey !== null) {
								const initialDOMElement = document.querySelector(`[uniqueKey="${elKey}"]`)
								if (initialDOMElement && isAugmentedDOM(initialDOMElement) && isAugmentedDOM(updatedElement)) {
									initialDOMElement.renderTrace = updatedElement.renderTrace
								}
							}
							resolve()
						})
						))
					}
					return undefined
				}))
			}, DEFAULT_UPDATE_INTERVAL_MILLISECONDS)
		}
	}
})()

/** Checks for compatibility between a DOM and UI element */
function areCompatible(_dom: DOMAugmented | Text, _elt: UIElement) {
	if (isTextDOM(_dom)) return false // DOM element is just a text element

	switch (true) {
		case (!isEltProper(_elt)):
			return false
		case (isComponentElt(_elt) && typeof _dom.renderTrace === "undefined"):
			console.warn(`DOM element ${_dom.id} has no render trace`)
			return false
		case (isIntrinsicElt(_elt) && _dom.renderTrace.componentElts.length > 0):
			return false
		case (isComponentElt(_elt) && _dom.renderTrace.componentElts.length === 0):
			return false
		case isComponentElt(_elt) && _elt.type === _dom.renderTrace.componentElts[0].type:
			return true
		case isIntrinsicElt(_elt) && _elt.type.toUpperCase() === _dom.tagName.toUpperCase():
			return true
		default:
			return false
	}
}

/** Returns a key for a child element that will be globally unique */
export const getHierarchicalKey = (element: UIElement, parentPrefixKey?: string, iteration?: number) => {
	const parentKey = parentPrefixKey !== undefined ? `${parentPrefixKey}-` : ""
	return isComponentElt(element)
		? element.props.key !== undefined
			? `${parentKey}${element.props.key}`
			: `${parentKey}${iteration !== undefined ? `(${iteration})` : ""}${element.type.name}`
		: isIntrinsicElt(element)
			? `${parentKey}${iteration !== undefined ? `(${iteration})` : ""}${element.type}` // No custom intrinsic element key through "element.props.key", since it should never be necessary
			: undefined
}

/** Returns the unique key of an element, if any */
export const getElementUniqueKey = (parentElem: DOMElement) => "uniqueKey" in parentElem && typeof parentElem.uniqueKey === "string"
	? parentElem.uniqueKey
	: ""
