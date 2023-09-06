import { default as morphdom } from 'morphdom'
import { String as String__, hasValue, flatten } from "@sparkwave/standard"
import { stringifyAttributes } from "./html"
import { createDOMShallow, updateDomShallow, isTextDOM, isAugmentedDOM, emptyContainer } from "./dom"
import { isFragmentElt, isComponentElt, isIntrinsicElt, isEltProper, getChildren, getLeafAsync, traceToLeafAsync, updateTraceAsync } from "./element"
import { Component, DOMElement, UIElement, ValueElement, IntrinsicElement, DOMAugmented } from "./types"
import { selfClosingTags } from "./common"

export const Fragment = ""
export type Fragment = typeof Fragment

let daemon: NodeJS.Timeout | undefined = undefined

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
		const domWithChildren = await updateChildrenAsync(dom, getChildren(leaf))
		return domWithChildren instanceof DocumentFragment
			? domWithChildren
			: Object.assign(domWithChildren, { renderTrace: trace })
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
		return String(leaf ?? "")
	}
}

/** Update the rendering of an existing DOM element (because the data on which its rendering was based has changed)
 * @param dom The DOM element whose rendering is to be updated
 * @param elt A UI (JSX) element that is used as the overriding starting point of the re-render, if passed
 * @returns The updated DOM element, which is updated in-place
 */
export async function updateAsync(dom: DOMAugmented/* | Text*/, elt?: UIElement): Promise<(DOMAugmented | DocumentFragment | Text)> {
	if (isTextDOM(dom)) {
		throw `UpdateAsync: Dom ${dom} is text`
	}
	// console.log(`Applying intrinsic leaf element ${stringify(eltLeaf)} to dom ${dom}}`)

	const newTrace = elt === undefined
		? await updateTraceAsync(dom.renderTrace)
		: areCompatible(dom, elt)
			? isComponentElt(elt)
				? await updateTraceAsync(dom.renderTrace, elt)
				: { componentElts: [], leafElement: elt }
			: undefined

	if (newTrace) {
		// console.log(`UpdateAsync ${invocationId}: Leaf of new trace for updating ${(dom)} = ${stringify(newTrace.leafElement)}`)

		const updatedDOM = updateDomShallow(dom, newTrace.leafElement)
		// console.log(`UpdateAsync ${invocationId}: Dom updated with new trace leaf: ${updatedDOM}`)

		if (updatedDOM !== dom) {
			throw `UpdateAsync: updatedDOM !== dom`
		}
		if (isIntrinsicElt(newTrace.leafElement) && !isTextDOM(updatedDOM)) {
			const _children = getChildren(newTrace.leafElement)
			const domWithChildren = await updateChildrenAsync(updatedDOM, _children)
			if (domWithChildren !== updatedDOM) {
				throw `UpdateAsync: domWithChildren !== updatedDOM`
			}
			// if (domWithChildren.childNodes.length !== _children.length)
			// throw `UpdateAsync ${invocationId}: domWithChildren.childNodes.length !== _children.length`

			// console.log(`UpdateAsync ${invocationId}: Dom updated with children: ${updatedDOM}`)
			// console.log(`UpdateAsync ${invocationId}: Updated dom's childNodes: ${updatedDOM.childNodes}; length=${updatedDOM.childElementCount}`)
			/*if (updatedDOM.childElementCount > 0) {
				const first = updatedDOM.children.item(0)!
				console.log(`UpdateAsync ${invocationId}: Updated dom's first child: ${first}`)
				console.log(`UpdateAsync ${invocationId}: Updated dom's first child nodeType: ${first.nodeType}`)
				if (first && first.hasChildNodes()) {
					console.log(`UpdateAsync ${invocationId}: Updated dom's first child's child node: ${first.childNodes}`)
				}
			}*/
		}

		return (updatedDOM instanceof DocumentFragment) || (updatedDOM instanceof Text)
			? updatedDOM
			: Object.assign(updatedDOM, { renderTrace: newTrace }) as DOMAugmented
	}
	else {
		if (elt === undefined) {
			throw `UpdateAsync: elt !== undefined`
		}
		// console.log(`UpdateAsync: dom and elt are NOT compatible, replacing dom with new render`)
		const replacement = await renderAsync(elt!)
		// console.log(`UpdateAsync ${invocationId}: New rendered dom to replace ${dom} = ${(replacement)}`)

		return (dom.replaceWith(replacement)), replacement
	}

	/** Update input DOM element to reflect input leaf UI element (type, props, and children)
	 * Posibly mutates the input node
	 */
	/*async function applyLeafElementAsync(dom: DOMElement, eltLeaf: RenderingTrace["leafElement"]): Promise<DOMAugmented | Text> {
		const updatedDOM = updateDomShallow(dom, eltLeaf)
		console.assert(updatedDOM === dom)
		if (isIntrinsicElt(eltLeaf) && !isTextDOM(updatedDOM)) {
			const domWithChildren = await updateChildrenAsync(updatedDOM, getChildren(eltLeaf))
			console.assert(domWithChildren === updatedDOM)
		}
		return updatedDOM
	}*/
	/** Checks for compatibility between a DOM and UI element */
	function areCompatible(_dom: DOMAugmented | Text, _elt: UIElement) {
		if (isTextDOM(_dom)) return false // DOM element is just a text element

		switch (true) {
			case (!isEltProper(_elt)):
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
}

/** Update children of an DOM element and return it; has side effects */
export async function updateChildrenAsync(eltDOM: DOMElement | DocumentFragment, children: UIElement[])/*: Promise<typeof eltDOM>*/ {
	// updatedDOM is a copy of the eltDOM that will be updated with the new children
	const updatedDOM = eltDOM.cloneNode(false) as DOMElement
	const flattenChildren = (_children: UIElement[]): UIElement[] => (_children
		.map(c =>
			isFragmentElt(c)
				? flattenChildren(getChildren(c))
				: c
		).flat()
	)

	const newDomChildren = await Promise.all(children.map(async child => {
		const updated: Promise<DOMAugmented | DocumentFragment | Text> = renderAsync(child)

		updated.then(_ => {
			// const op = matchingNode && isAugmentedDOM(matchingNode) ? updateAsync : renderAsync
			if (_ instanceof DocumentFragment && _.children.length === 0) {
				console.warn(`updateChildrenAsync: Returning empty doc fragment as dom for child ${JSON.stringify(child)}`)
			}
		})

		return updated
	}))

	// We insert the newDomChildren into the updatedDOM, in the same order as the domChildren
	updatedDOM.append(...newDomChildren)

	// If eltDOM is an existing DOM, we morph it with its new version
	if (!(eltDOM instanceof DocumentFragment)) {
		updateDOM(eltDOM, updatedDOM)
	}

	return eltDOM
}

export function updateDOM(rootElement: Element, node: Node) { morphdom(rootElement, node, { getNodeKey: () => undefined }) }

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
export function invalidateUI(invalidatedElementIds?: string[]) {
	document.dispatchEvent(new CustomEvent('UIInvalidated', { detail: { invalidatedElementIds } }))
}

const invalidatedElementIds: string[] = []
async function invalidationHandler(eventInfo: IUInvalidatedEvent) {
	const DEFAULT_UPDATE_INTERVAL_MILLISECONDS = 14

	//let daemon: NodeJS.Timeout | undefined = undefined

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
			await Promise.all(idsToProcess.map(id => {
				// console.log(`Updating "${id}" dom element...`)
				const elt = document.getElementById(id)
				if (elt) {
					return updateAsync(elt as DOMAugmented)
				}
				return undefined
			}))
		}, DEFAULT_UPDATE_INTERVAL_MILLISECONDS)
	}
}