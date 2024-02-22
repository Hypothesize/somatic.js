const nanomorph = require('nanomorph')
import { String as String__, hasValue, flatten } from "@sparkwave/standard"
import { stringifyAttributes } from "./html"
import { createDOMShallow, isTextDOM, isAugmentedDOM } from "./dom"
import { isFragmentElt, isComponentElt, isIntrinsicElt, isEltProper, getChildren, getLeafAsync, traceToLeafAsync, updateTraceAsync } from "./element"
import { Component, DOMElement, UIElement, ValueElement, IntrinsicElement, DOMAugmented } from "./types"
import { selfClosingTags } from "./common"

export const Fragment = ""
export type Fragment = typeof Fragment

/** JSX is transformed into calls of this function */
export function createElement<T extends string | Component>(type: T, props: (typeof type) extends Component<infer P> ? P : unknown, ...children: unknown[]) {
	return { type, props: props ?? {}, children: [...flatten(children)] }
}

/** Render a UI element into a DOM node (augmented with information used for subsequent updates) */
export async function renderAsync(elt: UIElement): Promise<(DOMAugmented | DocumentFragment | Text)> {
	if (hasValue(elt)
		&& typeof elt === "object"
		&& "props" in elt &&
		"children" in elt &&
		typeof elt.type === "undefined") {
		console.warn(`Object appearing to represent proper element has no type member\n
			This is likely an error arising from creating an element with an undefined component`)
		// return createDOMShallow(JSON.stringify(elt)) as Text
	}

	const trace = await traceToLeafAsync(elt)
	const leaf = trace.leafElement
	const dom = createDOMShallow(leaf)

	if (!isTextDOM(dom)) {
		await populateWithChildren(dom, getChildren(leaf))
		return dom instanceof DocumentFragment
			? dom
			: Object.assign(dom, { renderTrace: trace })
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

		const replacement = await renderAsync(elt)
		initialDOM.replaceWith(replacement)

		return initialDOM
	}
}

/** Update children of an DOM element and return it; has side effects */
export async function populateWithChildren(emptyDOM: DOMElement | DocumentFragment, children: UIElement[]) {
	const flattenChildren = (_children: UIElement[]): UIElement[] => (_children
		.map(c =>
			isFragmentElt(c)
				? flattenChildren(getChildren(c))
				: c
		).flat()
	)

	const newDomChildren = await Promise.all(flattenChildren(children).map(async child => {
		const matchingNode = isComponentElt(child) && typeof child.props !== "undefined" && child.props.id !== undefined
			? document.getElementById(child.props.id as string) as DOMAugmented | undefined
			: undefined

		const updated = matchingNode
			? updateAsync(matchingNode, child)
			: renderAsync(child)

		updated.then(_ => {
			if (_ instanceof DocumentFragment && _.children.length === 0) {
				console.warn(`populateWithChildren: Returning empty doc fragment as dom for child ${JSON.stringify(child)}`)
			}
		})

		return updated
	}))

	// We insert the newDomChildren into the updatedDOM, in the same order as the domChildren
	emptyDOM.append(...newDomChildren)
}

interface IUInvalidatedEvent extends Event {
	detail?: { invalidatedElementIds: string[] }
}
/** Convenience method to mount the entry point dom node of a client app */
export async function mountElement(element: UIElement, container: Element) {
	/** Library-specific DOM update/refresh interval */
	document.addEventListener('UIInvalidated', invalidationHandler)

	container.replaceChildren(await renderAsync(element))
}

/** Invalidate UI */
export function invalidateUI(invalidatedElementIds?: string[]/*, reason?: string */) {
	const ev = new CustomEvent('UIInvalidated', { detail: { invalidatedElementIds } })
	if (document.readyState === "complete") {
		document.dispatchEvent(ev)
	}
	else {
		// console.log(`\ndocument.readyState: ${document.readyState}`)
		document.onreadystatechange = async _ => {
			// console.log(`\ndocument.readyState changed to: ${document.readyState}`)
			if (document.readyState === "complete") {
				console.log(`\nDispatching UIInvalidated event for ids "${ev.detail.invalidatedElementIds}" after document loading complete\n`)
				document.dispatchEvent(ev)
			}
		}
	}
}

const invalidationHandler = (() => {
	let daemon: NodeJS.Timeout | undefined = undefined
	const invalidatedElementIds: string[] = []

	return async function (eventInfo: IUInvalidatedEvent) {
		const DEFAULT_UPDATE_INTERVAL_MILLISECONDS = 14

		// console.log(`UIInvalidated fired with detail: ${stringify((eventInfo as any).detail)}`)
		const _invalidatedElementIds: string[] = (eventInfo).detail?.invalidatedElementIds ?? []
		invalidatedElementIds.push(..._invalidatedElementIds)
		if (daemon === undefined) {
			daemon = setInterval(async () => {
				if (invalidatedElementIds.length === 0 && daemon) {
					clearInterval(daemon)
					daemon = undefined
				}
				const idsToProcess = invalidatedElementIds.splice(0, invalidatedElementIds.length)
				await Promise.all(idsToProcess.map(async id => {
					// console.log(`Updating "${id}" dom element...`)
					const elt = document.getElementById(id)
					if (elt) {
						const updatedElt = await updateAsync(elt as DOMAugmented) as HTMLElement
						nanomorph(elt, updatedElt)
						const childrenWithIds = updatedElt.querySelectorAll("[id]")
						await Promise.all([...childrenWithIds, updatedElt].map(updatedElement => new Promise<void>(resolve => {
							const elId = updatedElement.getAttribute("id")
							if (elId !== null) {
								const initialDOMElement = document.querySelector(`[id="${elId}"]`)
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