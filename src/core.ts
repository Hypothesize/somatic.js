/* eslint-disable fp/no-rest-parameters */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-var-requires */

import morphdom from 'morphdom'
import memoize from 'lodash/memoize'
import fastMemoize from 'fast-memoize'
import { Obj } from "@agyemanjp/standard"
import { default as cuid } from "cuid"
import { VNode, VNodeType, PropsExtended, Message } from "./types"
import { setAttribute, isEventKey } from "./utils"
import { svgTags, eventNames, mouseMvmntEventNames, } from "./constants"

// export const Fragment = (async () => ({})) as Renderer
export const fnStore: ((evt: Event) => unknown)[] = []

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createElement<P extends Obj = Obj, T extends VNodeType<P> = VNodeType<P>>(type: T, props: P, ...children: any[]): VNode<P, T> {
	return { type, props, children }
}

/** Render virtual node to DOM node */
export async function render<P extends Obj = Obj>(vnode?: { toString(): string } | VNode<P> | Promise<VNode<P>>): Promise<Node> {
	// console.log(`Starting render of vnode: ${JSON.stringify(vnode)}`)

	if (vnode === null || vnode === undefined) {
		// console.log(`VNode is null or undefined, returning empty text node`)
		return document.createTextNode("")
	}

	const _vnode = await vnode
	if (typeof _vnode === 'object' && 'type' in _vnode && 'props' in _vnode) {
		// console.log(`vNode is object with 'type' and 'props' properties`)

		const children = flattenNodes(_vnode.children || []) as JSX.Element[]
		switch (typeof _vnode.type) {
			case "function": {
				// console.log(`vNode type is function, rendering as custom component`)
				const _props: PropsExtended<P, Message> = { ..._vnode.props, children: [...children] }
				const element = await _vnode.type(_props)

				return element.children === undefined
					? await memoizedRender(element)
					: await render(element) // If element has children, we don't use the cache system (yet)
			}

			case "string": {
				// console.log(`vNode type is string, rendering as intrinsic component`)
				const node = svgTags.includes(_vnode.type)
					? document.createElementNS('http://www.w3.org/2000/svg', _vnode.type)
					: document.createElement(_vnode.type)

				// render and append children in order
				await Promise
					.all(children.map(c => render(c)))
					.then(rendered => rendered.forEach(child => node.appendChild(child)))

				// attach attributes
				const nodeProps = _vnode.props || {}
				Object.keys(nodeProps).forEach(propKey => {
					try {
						const propValue: unknown = nodeProps[propKey]
						if (propValue !== undefined) {
							const htmlPropKey = propKey.toUpperCase()
							if (isEventKey(htmlPropKey) && htmlPropKey === "ONLOAD") {
								// eslint-disable-next-line fp/no-mutating-methods
								fnStore.push(propValue as (evt: Event) => unknown)
								node.setAttribute(propKey.toLowerCase(), `${fnStore.length - 1}`)

								const callback: (evt: Event) => void = fnStore[fnStore.length - 1]
								node.addEventListener(eventNames[htmlPropKey], { handleEvent: callback })
							}
							else if (isEventKey(htmlPropKey) && typeof propValue === "function") { // The first condition is here simply to prevent useless searches through the events list.
								const eventId = cuid()
								// We attach an eventId per possible event: an element having an onClick and onHover will have 2 such properties.
								node.setAttribute(`data-${htmlPropKey}-eventId`, eventId)
								/** If the vNode had an event, we add it to the document-wide event. We keep track of every event and its matching element through the eventId: each listener contains one, each DOM element as well */
								addListener(document, eventNames[htmlPropKey], (e: Event) => {
									const target = e.target as HTMLElement | null
									if (target !== document.getRootNode()) { // We don't want to do anything when the document itself is the target
										// We bubble up to the actual target of an event: a <div> with an onClick might be triggered by a click on a <span> inside
										const intendedTarget = target ? target.closest(`[data-${htmlPropKey.toLowerCase()}-eventId="${eventId}"]`) : undefined

										// For events about mouse movements (onmouseenter...), an event triggered by a child should not activate the parents handler (we when leave a span inside a div, we don't activate the onmouseleave of the div)
										const shouldNotTrigger = mouseMvmntEventNames.includes(htmlPropKey) && intendedTarget !== target

										if (!shouldNotTrigger && intendedTarget) {
											// Execute the callback with the context set to the found element
											// jQuery goes way further, it even has it's own event object
											(propValue as (e: Event) => unknown).call(intendedTarget, e)
										}
									}
								}, true)
							}
							else {
								setAttribute(node, propKey, (propValue as (e: Event) => unknown))
							}
						}
					}
					catch (e) {
						console.error(`Error setting dom attribute ${propKey} to ${JSON.stringify(nodeProps[propKey])}:\n${e}`)
					}
				})
				return node
			}

			default: {
				console.error(`Somatic render(): invalid vnode "${JSON.stringify(_vnode)}" of type "${typeof _vnode}"; `)
				return document.createTextNode(String(_vnode))
			}
		}
	}
	else {
		return document.createTextNode(String(_vnode))
	}
}
const memoizedRender = fastMemoize(render, {})

/** Render virtual node to HTML string */
export async function renderToString<P extends Obj = Obj>(vnode?: { toString(): string } | VNode<P> | Promise<VNode<P>>): Promise<string> {
	const elt = (await render(vnode)) as Node | Element
	const result = ('outerHTML' in elt)
		? elt.outerHTML
		: (elt.textContent ?? elt.nodeValue ?? "")

	// console.log(`renderToString output: ${result}`)
	return result

	/*if (vnode === null || vnode === undefined) {
		return ""
	}
	const _vnode = await vnode

	if (typeof _vnode === 'object' && 'type' in _vnode) {
		const children = new Array(flatten(_vnode.children || [])) as Array<JSX.Element>
		switch (typeof _vnode.type) {
			case "function": {
				const _props: PropsExtended<P, Message> = { ..._vnode.props, children: [...children || []] }

				const resolvedVNode = await _vnode.type(_props)
				return typeof resolvedVNode.type === "function" && children.length === 0
					? await memoizedRenderToString(resolvedVNode)
					: await renderToString(resolvedVNode) // If elem have children, we don't use the cache system (yet).
			}

			case "string": {
				const notSelfClosing = !selfClosingTags.includes(_vnode.type.toLocaleLowerCase())
				const childrenHtml = (notSelfClosing && _vnode.children && _vnode.children.length > 0)
					? (await Promise.all(children.map(child => {
						return renderToString(child)
					}))).join("")
					: ""

				const nodeProps = _vnode.props || {}
				const attributesHtml = new SuperString(Object.keys(nodeProps)
					.map(propName => {
						const propValue = nodeProps[propName]
						switch (propName) {
							case "style":
								return `${propName}="${stringifyStyle(propValue as CSSProperties)}"`

							default:
								return typeof propValue === "string"
									? `${propName}="${encodeHTML(propValue)}"`
									: typeof propValue === "function"
										? `${propName.toLowerCase()}="(${escape(propValue.toString())})(this);"`
										: ""
						}
					})
					.filter(attrHTML => attrHTML?.length > 0)
					.join(" ")
				).prependSpaceIfNotEmpty().toString()

				return notSelfClosing
					? `<${_vnode.type}${attributesHtml}>${childrenHtml}</${_vnode.type}>`
					: `<${_vnode.type}${attributesHtml}>`

			}

			default:
				console.error(`\nrender(): invalid vnode type "${typeof _vnode}"; `)
				return String(_vnode)
		}
	}
	else {
		return String(_vnode)
	}*/
}
const memoizedRenderToString = memoize(renderToString, (obj: VNode) => obj.props)

/** Attach event listeners from element to corresponding nodes in container */
export function hydrate(element: HTMLElement): void {
	[...element.attributes].forEach(attr => {
		// Event attributes will give place to an event listener and be removed.
		if (isEventKey(attr.name)) {
			const callback: (evt: Event) => void = fnStore[parseInt(attr.value)]
			setAttribute(element, attr.name, callback)
			element.addEventListener(eventNames[attr.name], { handleEvent: callback })
			element.removeAttribute(attr.name)
		}
		else if (attr.name === "htmlfor") { // the innerHTML that we are hydrating might have turned the htmlFor to lowercase in some browsers
			setAttribute(element, "htmlFor", attr.value)
			element.removeAttribute(attr.name)
		}
		else if (attr.name === "classname") { // the innerHTML that we are hydrating might have turned the className to lowercase in some browsers
			setAttribute(element, "className", attr.value)
			element.removeAttribute(attr.name)
		}
		else {
			setAttribute(element, attr.name, attr.value)
		}
	});[...element["children"]].forEach(child => {
		hydrate(child as HTMLElement)
	})
}

/** Compares an HTML element with a node, and updates only the parts of the HTML element that are different
 * @param rootElement An HTML element that will be updated
 * @param node A node obtained by rendering a VNode
 */
export function updateDOM(rootElement: Element, node: Node) { morphdom(rootElement, node) }

function flattenNodes(arr: unknown[]) {
	const result: unknown[] = []
	if (!arr.length) { return result }

	const toString = Object.prototype.toString
	const arrayTypeStr = '[object Array]'
	const nodes = [...arr].slice() // Cloning
	// eslint-disable-next-line fp/no-mutating-methods, fp/no-let
	let node: unknown | undefined = nodes.pop()
	// eslint-disable-next-line fp/no-mutating-methods, fp/no-mutation, fp/no-loops
	do {
		if (toString.call(node) === arrayTypeStr)
			// eslint-disable-next-line prefer-spread, fp/no-mutating-methods
			nodes.push.apply(nodes, node as unknown[])
		else
			// eslint-disable-next-line fp/no-mutating-methods
			result.push(node)
		// eslint-disable-next-line fp/no-mutation, fp/no-mutating-methods
	} while (nodes.length && (node = nodes.pop()) !== undefined)

	// eslint-disable-next-line fp/no-mutating-methods
	result.reverse()
	return result
}

const _eventHandlers: { [key: string /** The name of a JS event, i.e. onmouseenter */]: { node: Node, handler: (e: Event) => void, capture: boolean }[] } = {} // Global dictionary of events
const addListener = (node: Node, event: string, handler: (e: Event) => void, capture = false) => {
	if (_eventHandlers[event] === undefined) {
		// eslint-disable-next-line fp/no-mutation
		_eventHandlers[event] = []
	}
	// Here we track the events and their nodes (note that we cannot use node as Object keys, as they'd get coerced into a string)
	// eslint-disable-next-line fp/no-mutating-methods
	_eventHandlers[event].push({ node: node, handler: handler, capture: capture })
	node.addEventListener(event, handler, capture)
}

export const removeAllListeners = (targetNode: Node) => {
	Object.keys(_eventHandlers).forEach(eventName => {
		// remove listeners from the matching nodes
		_eventHandlers[eventName]
			.filter(({ node }) => node === targetNode)
			.forEach(({ node, handler, capture }) => node.removeEventListener(eventName, handler, capture))

		// update _eventHandlers global
		// eslint-disable-next-line fp/no-mutation
		_eventHandlers[eventName] = _eventHandlers[eventName].filter(
			({ node }) => node !== targetNode,
		)
	})
}

/*export function difference(object: Obj, base: Obj): Obj {
	function changes(_object: Obj, _base: Obj) {
		return transform(_object, function (result: Obj, value, key) {
			if (!isEqual(value, _base[key])) {
				result[key] = (isObject(value) && isObject(_base[key])) ? changes(value, _base[key]) : value
			}
		})
	}
	return changes(object, base)
}*/