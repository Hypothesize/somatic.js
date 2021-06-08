/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cuid from 'cuid'

import { Obj, String, flatten, hasValue, deepMerge } from "@sparkwave/standard"
import { Component, ComponentOptions, VNode, VNodeType, CSSProperties, Message, MergedPropsExt, PropsExtended } from "./types"
import { svgTags, selfClosingTags } from "./constants"

import morphdom from "morphdom"

/** JSX is transformed into calls of this function */
export function createElement<P extends Obj, T extends VNodeType<P>>(type: T, props: P, ...children: any[]): VNode<P, T> {
	return {
		type: type,
		props: props,
		children: children
	}
}

/** Render virtual node to DOM node */
export async function render(vnode: undefined | null | string | VNode, producer?: AsyncGenerator<VNode, VNodeType<Obj>>): Promise<Node & { producer?: AsyncGenerator<VNode, VNodeType<Obj>> }> {
	// console.log(`Starting render of vnode: ${JSON.stringify(vnode)}`)

	if (vnode === null || vnode === undefined) {
		// console.log(`VNode is null or undefined, returning empty text node`)
		return document.createTextNode("")
	}

	if (typeof vnode === 'object' && 'type' in vnode && 'props' in vnode) {
		const childVNodes = [...flatten([vnode.children]) as VNode[]]
		switch (typeof vnode.type) {
			case "function": {
				// console.log(`vNode type is function "${vnode.type.name}", rendering as custom component`)
				const vNodeType = vnode.type as Component
				const generator = vNodeType({ ...vnode.props, children: [...childVNodes] }, async (key: string) => {
					// eslint-disable-next-line fp/no-mutating-methods
					pendingUpdates.push({ elementKey: key })
				})
				const nextRender = await generator.next()
				const nextElem = nextRender.value
				if (vnode.props && vnode.props.key) {
					// eslint-disable-next-line fp/no-mutation
					nextElem["props"] = nextElem["props"] ? nextElem["props"] : {}
					// eslint-disable-next-line fp/no-mutation
					nextElem["props"].key = vnode.props ? vnode.props.key : undefined
				}

				return await render(nextElem, generator)
			}

			case "string": {
				// console.log(`Rendering "${vnode.type}" as intrinsic component`)
				const node = svgTags.includes(vnode.type)
					? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
					: document.createElement(vnode.type)
				// console.log(`Created node ${node} for "${vnode.type}"; its appendChild is "${node.appendChild}"`)

				// console.log(`Rendering and appending children ${childVNodes} in order for "${vnode.type}"`)
				// render and append children in order
				try {
					await Promise
						.all(childVNodes.map(c => {
							return render(c)
						}))
						.then(childDomNodes => childDomNodes.forEach(
							/* dont use node.appendChild drectly here */
							c => node.appendChild(c)
						))
				}
				catch (e) {
					throw new Error(`Error appending children ${childVNodes} for "${vnode.type}"`)
				}

				// attach attributes
				console.log(`Attaching attribute keys [${Object.keys(vnode.props ?? {}).join(", ")}] on "${vnode.type}"`)
				const nodeProps = vnode.props ?? {}
				Object.keys(nodeProps).forEach(propKey => setAttribute(node, propKey, nodeProps[propKey]));
				// eslint-disable-next-line fp/no-mutation
				(node as (HTMLElement | SVGElement) & { producer?: AsyncGenerator<VNode, VNodeType<Obj>> })["producer"] = producer
				return node
			}

			default: {
				console.error(`Somatic render(): invalid vnode "${JSON.stringify(vnode)}" of type "${typeof vnode}"; `)
				return document.createTextNode(globalThis.String(vnode))
			}
		}
	}
	else {
		return document.createTextNode(globalThis.String(vnode))
	}
}

export async function renderToString(vnode: undefined | null | string | VNode): Promise<string> {
	// console.log(`Starting render of vnode: ${JSON.stringify(vnode)}`)

	if (vnode === null || vnode === undefined) {
		// console.log(`VNode is null or undefined, returning empty text node`)
		return ("")
	}

	if (typeof vnode === 'object' && 'type' in vnode && 'props' in vnode) {
		const childVNodes = [...flatten([vnode.children]) as VNode[]]
		const vNodeType = vnode.type
		switch (typeof vNodeType) {
			case "function": {
				// console.log(`vNode type is function, rendering as custom component`
				const generator = vNodeType({ ...vnode.props, children: [...childVNodes] }, async key => {
					// eslint-disable-next-line fp/no-mutating-methods
					pendingUpdates.push({ elementKey: key })
				})
				return renderToString((await generator.next()).value)
			}

			case "string": {
				// console.log(`vNode type is string, rendering as intrinsic component`)

				const notSelfClosing = !selfClosingTags.includes(vNodeType.toLocaleLowerCase())
				const childrenHtml = (notSelfClosing && childVNodes && childVNodes.length > 0)
					? (await Promise.all(childVNodes.map(renderToString))).join("")
					: ""

				const nodeProps = vnode.props || {}
				const attributesHtml = new String(Object.keys(nodeProps)
					.map(propName => {
						const propValue = nodeProps[propName]
						switch (propName) {
							case "style":
								return `${propName}="${stringifyStyle(propValue as CSSProperties)}"`

							default:
								return typeof propValue === "string"
									? `${propName}="${encodeHTML(propValue)}"`
									: typeof propValue === "function"
										? `${propName.toLowerCase()}="(${encodeHTML(propValue.toString())})(this);"`
										: ""
						}
					})
					.filter(attrHTML => attrHTML?.length > 0)
					.join(" ")
				).prependSpaceIfNotEmpty().toString()

				return notSelfClosing
					? `<${vNodeType}${attributesHtml}>${childrenHtml}</${vNodeType}>`
					: `<${vNodeType}${attributesHtml}>`
			}

			default: {
				console.error(`Somatic render(): invalid vnode "${JSON.stringify(vnode)}" of type "${typeof vnode}"; `)
				return globalThis.String(vnode)
			}
		}
	}
	else {
		return globalThis.String(vnode)
	}
}

export function updateDOM(rootElement: Element, node: Node) {
	morphdom(rootElement, node, { getNodeKey: () => undefined })
}

type PendingUpdate = { elementKey: string } // | "global"
export const pendingUpdates = [] as PendingUpdate[]

//#region types

export function makeComponent<P extends Obj = Obj, S extends Obj = Obj>(core: (props: P & { key?: string, children?: VNode[] }, reRender: (key: string) => void) => AsyncGenerator<VNode<P>>, options?: ComponentOptions): Component<P> {
	// eslint-disable-next-line fp/no-mutating-assign
	return Object.assign(core, options)
}

/** Special attributes that map to DOM events. */
export const eventNames = {
	ONABORT: "abort",
	ONANIMATIONSTART: "animationstart",
	ONANIMATIONITERATION: "animationiteration",
	ONANIMATIONEND: "animationend",
	ONBLUR: "blur",
	ONCANPLAY: "canplay",
	ONCANPLAYTHROUGH: "canplaythrough",
	ONCHANGE: "change",
	ONCLICK: "click",
	ONCONTEXTMENU: "contextmenu",
	ONCOPY: "copy",
	ONCUT: "cut",
	ONDOUBLECLICK: "dblclick",
	ONDRAG: "drag",
	ONDRAGEND: "dragend",
	ONDRAGENTER: "dragenter",
	ONDRAGEXIT: "dragexit",
	ONDRAGLEAVE: "dragleave",
	ONDRAGOVER: "dragover",
	ONDRAGSTART: "dragstart",
	ONDROP: "drop",
	ONDURATIONCHANGE: "durationchange",
	ONEMPTIED: "emptied",
	ONENCRYPTED: "encrypted",
	ONENDED: "ended",
	ONERROR: "error",
	ONFOCUS: "focus",
	ONINPUT: "input",
	ONINVALID: "invalid",
	ONKEYDOWN: "keydown",
	ONKEYPRESS: "keypress",
	ONKEYUP: "keyup",
	ONLOAD: "load",
	ONLOADEDDATA: "loadeddata",
	ONLOADEDMETADATA: "loadedmetadata",
	ONLOADSTART: "loadstart",
	ONPAUSE: "pause",
	ONPLAY: "play",
	ONPLAYING: "playing",
	ONPROGRESS: "progress",
	ONMOUSEDOWN: "mousedown",
	ONMOUSEENTER: "mouseenter",
	ONMOUSELEAVE: "mouseleave",
	ONMOUSEMOVE: "mousemove",
	ONMOUSEOUT: "mouseout",
	ONMOUSEOVER: "mouseover",
	ONMOUSEUP: "mouseup",
	ONPASTE: "paste",
	ONRATECHANGE: "ratechange",
	ONRESET: "reset",
	ONSCROLL: "scroll",
	ONSEEKED: "seeked",
	ONSEEKING: "seeking",
	ONSUBMIT: "submit",
	ONSTALLED: "stalled",
	ONSUSPEND: "suspend",
	ONTIMEUPDATE: "timeupdate",
	ONTRANSITIONEND: "transitionend",
	ONTOUCHCANCEL: "touchcancel",
	ONTOUCHEND: "touchend",
	ONTOUCHMOVE: "touchmove",
	ONTOUCHSTART: "touchstart",
	ONVOLUMECHANGE: "volumechange",
	ONWAITING: "waiting",
	ONWHEEL: "wheel"
}

/** Mouse event names */
export const mouseMvmntEventNames = [
	"ONMOUSEENTER",
	"ONMOUSELEAVE",
	"ONMOUSEMOVE",
	"ONMOUSEOUT",
	"ONMOUSEOVER",
	"ONMOUSEUP"
]

/** Converts a css props object literal to a string */
export function stringifyStyle(style: CSSProperties, important = false) {
	if (typeof style === "object") {
		return Object.keys(style)
			.map((key) => `${camelCaseToDash(key)}: ${(style)[key as keyof typeof style]}${important === true ? " !important" : ""}`)
			.join("; ")
			.concat(";")
	}
	else {
		console.warn(`Input "${JSON.stringify(style)}" to somatic.stringifyStyle() is of type ${typeof style}, returning empty string`)
		return ""
	}
}

export function stringifyAttribs(props: Obj) {
	return Object.keys(props)
		.map(name => {
			const value = props[name]
			switch (true) {
				case name === "style":
					return (`style="${encodeHTML(stringifyStyle(value as CSSProperties))}"`)
				case typeof value === "string":
					return (`${encodeHTML(name)}="${encodeHTML(globalThis.String(value))}"`)
				case typeof value === "number":
					return (`${encodeHTML(name)}="${value}"`)
				// case typeof value === "function":
				// 	fnStore.push(value as (e: Event) => unknown)
				// 	return (`${encodeHTML(name.toLowerCase())}="${fnStore.length - 1}"`)
				case value === true:
					return (`${encodeHTML(name)}`)
				default:
					return ""
			}
		})
		.filter(attrHTML => attrHTML?.length > 0)
		.join(" ")
}

export function camelCaseToDash(str: string) {
	return str
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/([0-9])([^0-9])/g, '$1-$2')
		.replace(/([^0-9])([0-9])/g, '$1-$2')
		.replace(/-+/g, '-')
		.toLowerCase()
}

export function encodeHTML(str: string) {
	return str.replace(/[&<>"']/g, (match) => {
		switch (match) {
			case "&":
				return "&amp;"
			case "<":
				return "&lt;"
			case ">":
				return "&gt;"
			case '"':
				return "&quot;"
			case "'":
				return "&#039;"
			default:
				return ""
		}
	})
}

/** Checks if a string corresponds to one of the (uppercase) event names keys */
export function isEventKey(key: string): key is keyof typeof eventNames {
	const keyUpper = key.toUpperCase()
	return keyUpper.startsWith("ON") // this condition is simply to prevent useless searches through the events list.
		&& Object.keys(eventNames).includes(keyUpper)
}

/** Global dictionary of events indexed by their names e.g., onmouseenter */
const _eventHandlers: Obj<{ node: Node, handler: (e: Event) => void, capture: boolean }[]> = {}
const addListener = (node: Node, event: string, handler: (e: Event) => void, capture = false) => {
	if (_eventHandlers[event] === undefined) {
		_eventHandlers[event] = []
	}
	// Here we track the events and their nodes (note that we cannot use node as Object keys, as they'd get coerced into a string)
	_eventHandlers[event].push({ node: node, handler: handler, capture: capture })
	node.addEventListener(event, handler, capture)
}

/** Remove all event listeners */
export const removeListeners = (targetNode: Node) => {
	Object.keys(_eventHandlers).forEach(eventName => {
		// remove listeners from the matching nodes
		_eventHandlers[eventName]
			.filter(({ node }) => node === targetNode)
			.forEach(({ node, handler, capture }) => node.removeEventListener(eventName, handler, capture))

		// update _eventHandlers global
		_eventHandlers[eventName] = _eventHandlers[eventName].filter(
			({ node }) => node !== targetNode,
		)
	})
}

export function setAttribute(element: HTMLElement | SVGElement, key: string, value?: any) {
	if (!hasValue(value)) return

	try {
		// if (isEventKey(key.toUpperCase()) && typeof value === "function") {
		// 	setAttribute(node, key, (value as (e: Event) => unknown))
		// }
		// else {
		// 	setAttribute(node, propKey, globalThis.String(propValue))
		// }

		// if (typeof value === "function") {
		// 	if (key === "ref") {
		// 		value(dom)
		// 	}
		// }
		// else

		if (['checked', 'value', 'htmlFor'].includes(key.toLocaleLowerCase())) {
			(element as any)[key] = value
		}
		else if (key.toLocaleLowerCase() === 'className') { // We turn the 'className' property into the HTML class attribute
			const classes = (value as string).split(/\s/)
			classes.forEach(cl => {
				element.classList.add(cl)
			})
		}
		else if (key.toLocaleLowerCase() == 'style' && typeof value == 'object') {
			// console.log(`Somatic set ${key} attribute to value: ${JSON.stringify(value)}`)
			Object.assign(element.style, value)
			//dom.innerHTML
		}
		else if (typeof value === 'function') {
			console.log(`Setting attribute "${key}" to function "${value.toString()}" on "${element.tagName}"`)

			const htmlPropKey = key.toUpperCase()
			if (isEventKey(htmlPropKey)) {

				const eventId = cuid.default()
				// We attach an eventId per possible event: an element having an onClick and onHover will have 2 such properties.
				element.setAttribute(`data-${htmlPropKey}-eventId`, eventId)

				// If the vNode had an event, we add it to the document-wide event. 
				// We keep track of every event and its matching element through the eventId:
				// each listener contains one, each DOM element as well
				addListener(document, eventNames[htmlPropKey], (e: Event) => {
					const target = e.target as HTMLElement | null
					if (target !== document.getRootNode()) {
						// We don't want to do anything when the document itself is the target
						// We bubble up to the actual target of an event: a <div> with an onClick might be triggered by a click on a <span> inside
						const intendedTarget = target ? target.closest(`[data-${htmlPropKey.toLowerCase()}-eventId="${eventId}"]`) : undefined

						// For events about mouse movements (onmouseenter...), an event triggered by a child should not activate the parents handler (we when leave a span inside a div, we don't activate the onmouseleave of the div)
						// We also don't call handlers if the bubbling was cancelled in a previous handler (from a child element)
						const shouldNotTrigger = mouseMvmntEventNames.includes(htmlPropKey) && intendedTarget !== target
							|| e.cancelBubble

						if (!shouldNotTrigger && intendedTarget) {
							// Execute the callback with the context set to the found element
							// jQuery goes way further, it even has it's own event object
							(value as (ev: Event) => unknown).call(intendedTarget, e)
						}
					}
				}, true)
			}
			else {
				setAttribute(element, key, (value as (ev: Event) => unknown))
			}
		}
		else {
			element.setAttribute(key, value)
		}
	}
	catch (e) {
		console.error(`Error setting dom attribute "${key}" to value "${JSON.stringify(value)}:\n${e}`)
	}
}


/*class IdProvider {
	private cache: string[]
	private pointer: number
	constructor() {
		this.cache = []
		this.pointer = 0
	}
	next() {
		if (this.pointer >= this.cache.length) {
			// console.log(`pushing to id provider cache`)
			this.cache.push(cuid.default())
		}
		return this.cache[this.pointer++]
	}
	reset() {
		this.pointer = 0
	}
}
export const idProvider = new IdProvider()
*/

/** Turns a vNode representing a component into a vNode representing an intrisic (HTML) element */
// const getIntrinsicFromComponentElement = async <Props extends Obj, State extends Obj>(_vnode: VNode) => {
// 	const children = [...flatten([_vnode.children]) as JSX.Element[]]

// 	const component = _vnode.type as Component<Props, State>
// 	const _props = { ..._vnode.props, children: [...children] } as PropsExtended<Props, Message>

// 	const fullProps = deepMerge("defaultProps" in component && component.defaultProps && typeof component.defaultProps === "function"
// 		? component.defaultProps as PropsExtended<Props, Message>
// 		: {} as PropsExtended<Props, Message>,
// 		_props
// 	)

// 	const intrinsicNode = await component(_props,
// 		async () => {
// 			if (fullProps.key === undefined) {
// 				console.error("Cannot change the state of a component without a key")
// 			}
// 			else {
// 				console.log(`Re-rendering`)
// 			}

// 			// We re-render the element
// 			const newElem = await getIntrinsicFromComponentElement<Props, State>(_vnode)
// 			const newElem2 = createElement(_vnode, fullProps)
// 			const renderedElem = await render(newElem2) // If element has children, we don't use the cache system (yet)
// 			const elements = document.querySelectorAll(`[key="${_props.key}"]`)
// 			if (elements.length > 1) {
// 				console.error(`More than 1 component have the key '${_props.key}'`)
// 			}
// 			else {
// 				if (elements[0] !== undefined) {
// 					updateDOM(elements[0], renderedElem)
// 				}
// 				else {
// 					console.error(`Cannot update an element after setState: key '${_props.key}' not found in the document`)
// 				}
// 			}

// 		}
// 	)
// 	// if (intrinsicNode.props && _vnode.props && _vnode.props.key) {
// 	// 	intrinsicNode.props.key = _vnode.props ? _vnode.props.key : undefined
// 	// }
// 	return intrinsicNode
// }

(function refresh() {
	pendingUpdates.forEach(async update => {
		const elements = document.querySelectorAll(`[key="${update.elementKey}"]`)
		if (elements.length > 1) {
			console.error(`More than 1 component have the key '${update.elementKey}'`)
		}
		else {
			const node = elements[0] as Node & { producer?: AsyncGenerator<VNode, VNodeType<Obj>> } | undefined
			if (node !== undefined && node.producer) {

				// eslint-disable-next-line fp/no-loops
				while (node.firstChild !== null) {
					node.removeChild(node.firstChild!)
				}

				const nextIteration = await node.producer!.next()
				const nextElem = nextIteration.value as any
				const renderedElem = await render(nextElem, node.producer)

				node.appendChild(renderedElem)
			}
			else {
				console.error(`Cannot update an element after setState: key '${update.elementKey}' not found in the document`)
			}
		}

		// eslint-disable-next-line fp/no-mutating-methods
		pendingUpdates.pop()
	})
	setTimeout(refresh, 50)
})()