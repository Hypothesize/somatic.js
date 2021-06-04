/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Obj, String, flatten, deepMerge } from "@sparkwave/standard"
import { Component, ComponentOptions, VNode, VNodeType, CSSProperties, Message, MergedPropsExt, PropsExtended } from "./types"
// import * as cuid from "cuid"
import morphdom from "morphdom"
import { idProvider } from './utils'

/** JSX is transformed into calls of this function */
export function createElement<P extends Obj, T extends VNodeType<P>>(type: T, props: P, ...children: any[]): VNode<P, T> {
	return { type, props, children }
}

/** Render virtual node to DOM node */
export async function render(vnode: undefined | null | string | VNode): Promise<Node & { producer?: Component }> {
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
				const generator = vnode.type({ ...vnode.props, children: [...childVNodes] })
				const node = render((await generator.next()).value)

				// console.log(`Generator ${generator} being assigned as producer of node ${node} for vnode type function "${vnode.type.name}"`)
				return Object.assign(node, { producer: generator })
			}

			case "string": {
				// console.log(`vNode type is string, rendering as intrinsic component`)
				const node = svgTags.includes(vnode.type)
					? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
					: document.createElement(vnode.type)

				// render and append children in order
				await Promise
					.all(childVNodes.map(render))
					.then(childDomNodes => childDomNodes.forEach(childDomNode => {
						node.appendChild(childDomNode)
					}))

				// attach attributes
				const nodeProps = vnode.props || {}
				Object.keys(nodeProps).forEach(propKey => {
					try {
						const propValue = nodeProps[propKey]
						if (propValue !== undefined) {
							const htmlPropKey = propKey.toUpperCase()
							if (isEventKey(htmlPropKey) && typeof propValue === "function") {
								// The first condition above is to prevent useless searches through the events list.
								const eventId = idProvider.next()
								// We attach an eventId per possible event: an element having an onClick and onHover will have 2 such properties.
								node.setAttribute(`data-${htmlPropKey}-eventId`, eventId)

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
				if (vnode.props && vnode.props.key) {
					setAttribute(node, "key", vnode.props["key"] as string)
				}

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
				const generator = vNodeType({ ...vnode.props, children: [...childVNodes] })
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

type PendingUpdate = { elementId: string } // | "global"
export const pendingUpdates = [] as PendingUpdate[]

// while (true) {
// 	pendingUpdates.forEach(async update => {
// 		const node = document.getElementById(update.elementId) as unknown as Node & { producer: AsyncGenerator<VNode> }
// 		if (node.parentNode) {
// 			while (node.parentNode.hasChildNodes) { node.removeChild(node.firstChild!) }
// 			node.appendChild(await render((await node.producer.next()).value))
// 		}
// 	})
// }



export const makeComponent1 = <DP, DS>(args:
	{
		defaultProps?: () => DP,
		defaultState?: (props: DP) => DS
	}) => {
	return <P extends Obj = Obj, M extends Message = Message, S = {}>(
		comp: (
			props: PropsExtended<P, M>,
			mergedProps: MergedPropsExt<P, M, DP>,
			stateCache: DS & S & Partial<S> & { setState: (delta: Partial<S>) => void }
		) => JSX.Element) => {

		return Object.assign(comp, { ...args })
	}
}

export function makeComponent<P extends Obj = Obj>(core: (props: P & { key?: string, children?: VNode[] }) => AsyncGenerator<VNode>, options?: ComponentOptions): Component<P> {
	return Object.assign(core, options)
}

/** Merge default props with actual props of renderer */
export function mergeProps<P extends Obj, D extends Partial<P>>(defaults: D, props: P): D & P & Partial<P> {
	return deepMerge(defaults, props) as D & P & Partial<P>
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

export const svgTags = [
	"animate",
	"animateMotion",
	"animateTransform",

	"circle",
	"clipPath",
	"color-profile",

	"defs",
	"desc",
	"discard",

	"ellipse",

	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence",
	"filter",
	"foreignObject",

	"g",

	"hatch",
	"hatchpath",

	"image",

	"line",
	"linearGradient",

	"marker",
	"mask",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"metadata",
	"mpath",

	"path",
	"pattern",
	"polygon",
	"polyline",

	"radialGradient",
	"rect",

	//"script",
	"set",
	"solidcolor",
	"stop",
	//"style",
	"svg",
	"switch",
	"symbol",

	"text",
	"textPath",
	//"title",
	"tspan",

	"unknown",
	"use",

	"view"
]

export const selfClosingTags = [
	"area",
	"base",
	"br",
	"col",
	"command",
	"embed",
	"hr",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
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

export function setAttribute(element: HTMLElement | SVGElement, key: string, value: string | ((e: Event) => unknown)) {
	// if (typeof value === "function") {
	// 	if (key === "ref") {
	// 		value(dom)
	// 	}
	// }
	// else
	if (['checked', 'value', 'htmlFor'].includes(key)) {
		(element as any)[key] = value
	}
	else if (key === 'className') { // We turn the 'className' property into the HTML class attribute
		const classes = (value as string).split(/\s/)
		classes.forEach(cl => {
			element.classList.add(cl)
		})
	}
	else if (key == 'style' && typeof value == 'object') {
		// console.log(`Somatic set ${key} attribute to value: ${JSON.stringify(value)}`)
		Object.assign(element.style, value)
		//dom.innerHTML
	}
	else if (typeof value !== 'object' && typeof value !== 'function') {
		element.setAttribute(key, value)
	}
}

/** Global dictionary of events indexed by their names e.g., onmouseenter */
const _eventHandlers: Obj<{ node: Node, handler: (e: Event) => void, capture: boolean }[]> = {}
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