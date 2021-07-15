/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cuid from 'cuid'

import { Obj, String, flatten, hasValue, deepMerge, isAsyncIterable } from "@sparkwave/standard"
import { Component, VNode, VNodeType, CSSProperties, ExtractOptional, ComponentOptions, Message } from "./types"
import { svgTags, selfClosingTags } from "./constants"
import { default as hashSum } from "hash-sum"
import morphdom from "morphdom"

/** JSX is transformed into calls of this function */
export function createElement<P extends Obj, T extends VNodeType<P>>(type: T, props: P, ...children: VNode[]): VNode<P, T> {
	return { type, props, children }
}

/** Cache of component invocations, indexed by the hash of the key + property */
const cache = {} as Obj<JSX.Element /* AsyncGenerator<JSX.Element> (stateful) or Promise<JSX.Element> (pure) */, string /* hash (based on the component's key + props) */>

/** Render virtual node to DOM node.
 * 
 * @param vnode The node to render
 * @param parentHash If passed, will be attached to this element's own key to generate a unique hash
 * @param hashToWrite If the component is instrinsic, it will insert this hash as an html attribute (for targeting purpose during re-render)
 */
export async function render(vnode: undefined | null | string | JSX.Element, parentHash?: string, hashToWrite?: string): Promise<Node> {

	if (vnode === null || vnode === undefined) {
		// console.log(`VNode is null or undefined, returning empty text node`)
		return document.createTextNode("")
	}
	if (typeof vnode === 'object' && 'type' in vnode && 'props' in vnode) {
		const childVNodes = [...flatten(vnode.children || []) as VNode[]]

		const customKey = vnode.props && vnode.props.key as string | undefined

		switch (typeof vnode.type) {
			case "function": {
				const vnodeType = vnode.type as Component
				const effectiveKey = customKey ?? `${parentHash}-component`
				const hash = getHash({ ...vnode.props, key: effectiveKey, children: vnode.children || [] })
				// console.log(`Rendering component '${effectiveKey}', hash: ${hash}`)

				// We use the cache for stateful component (no 'isPure' option) and pure function components
				const useCache = !("isPure" in vnodeType) || vnodeType.isPure === true

				// If entry doesn't exist in the cache, we add it.
				if (!cache[hash] && useCache) {
					cache[hash] = vnodeType({ ...vnode.props, key: effectiveKey, children: vnode.children })
				}

				const producer = useCache
					? cache[hash]
					: vnodeType({ ...vnode.props, key: effectiveKey, children: vnode.children })

				// We generate the content from the component
				const elem = isAsyncIterable(producer)
					? (await producer.next()).value
					: await producer

				// If this element is stateful or child of a stateful one, we instruct its children to write its hash as an HTML attribute.
				return await render(elem, hash, hashToWrite ? hashToWrite : isAsyncIterable(producer) ? hash : undefined)
			}

			case "string": {
				// console.log(`Rendering "${vNodeType}", intrinsic component`)
				const node = svgTags.includes(vnode.type)
					? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
					: document.createElement(vnode.type)
				// console.log(`Created node ${node} for "${vnode.type}"; its appendChild is "${node.appendChild}"`)

				// console.log(`Rendering and appending children ${childVNodes} in order for "${vnode.type}"`)
				// render and append children in order
				try {
					await Promise
						.all(childVNodes.map((c, i) => {
							return render(c, `${parentHash ? parentHash + "_" : ""}${vnode.type}${i}`)
						}))
						.then(childDomNodes => childDomNodes.forEach(
							/* dont use node.appendChild drectly here */
							c => node.appendChild(c)
						))
				}
				catch (e) {
					throw new Error(`Error appending children ${childVNodes} for "${vnode.type}"`)
				}

				// Attaching attributes
				const nodeProps = vnode.props ?? {}
				Object.keys(nodeProps).forEach(propKey => setAttribute(node, propKey, nodeProps[propKey]))

				// If the instrinsic component is the representation of a stateful component, it will need a hash attribute to be targeted
				if (hashToWrite) {
					setAttribute(node, "hash", hashToWrite)
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
		switch (typeof vnode.type) {
			case "function": {
				const vNodeType = vnode.type as Component
				// console.log(`vNode type is function, rendering as custom component`
				const generator = vNodeType({
					...vnode.props,
					children: [...childVNodes],
					key: vnode.props.key as string || ""
				})
				return renderToString((await (generator as AsyncGenerator).next()).value)
			}

			case "string": {
				// console.log(`vNode type is string, rendering as intrinsic component`)

				const notSelfClosing = !selfClosingTags.includes(vnode.type.toLocaleLowerCase())
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
					? `<${vnode.type}${attributesHtml}>${childrenHtml}</${vnode.type}>`
					: `<${vnode.type}${attributesHtml}>`
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

/** Morph the actual DOM elements of the document into their updated version */
export function updateDOM(rootElement: Element, node: Node) {
	morphdom(rootElement, node, {
		getNodeKey: () => undefined
	})
}

/** The list of stateful components waiting for a re-render, indexed by their hash */
const pendingUpdates: string[] = []

/** Turn a function into a component (stateful or functional), merging the defaultProps to the props passed by the user and adding the requireUpdate method if the component is stateful*/
export function makeComponent<P extends Obj = Obj, D = Partial<ExtractOptional<P>>>(core: (props: P & D & { key?: string, children?: VNode[] }) => JSX.Element, options: ComponentOptions & { stateful: false }): Component<P>
export function makeComponent<P extends Obj = Obj, D = Partial<ExtractOptional<P>>>(core: (props: P & D & { key: string, children?: VNode[], requireUpdate: () => void }) => AsyncGenerator<JSX.Element>, options: ComponentOptions & { stateful: true }): Component<P>
export function makeComponent<P extends Obj = Obj, D = Partial<ExtractOptional<P>>>(core: (props: P & D & { key?: string, children?: VNode[], requireUpdate?: () => void }) => AsyncGenerator<JSX.Element> | JSX.Element, options: ComponentOptions & { stateful: boolean }): Component<P> {
	return Object.assign((args: P & { key?: string }) => {
		const completeProps = deepMerge(options.defaultProps, args, {
			key: args.key || cuid.default(),
			...options.stateful === true
				? {
					requireUpdate: async () => {
						if (__SomaticRenderingLoop__ === undefined) { // We activate the rendering loop if it wasn't already
							startRenderingLoop()
						}
						// eslint-disable-next-line fp/no-mutating-methods
						pendingUpdates.push(getHash(args))
					}
				}
				: {}
		}) as P & D & { key: string, requireUpdate?: () => void }
		return core.call({}, completeProps)
	}, options)
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

/** Remove all event listeners stored in the document object, to prevent clogging */
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
		else if (key.toLocaleLowerCase() === 'classname') { // We turn the 'className' property into the HTML class attribute
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
			// console.log(`Setting attribute "${key}" to function "${value.toString()}" on "${element.tagName}"`)

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
				// setAttribute(element, key, (value as (ev: Event) => unknown))
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

// eslint-disable-next-line fp/no-let
let __SomaticRenderingLoop__: number | undefined = undefined

/** Starts the loop that checks for pending re-rendering every 50ms */
const startRenderingLoop = () => {
	__SomaticRenderingLoop__ = setInterval(() => {
		pendingUpdates.forEach(async elementHash => {
			// We remove the update from the pending list
			// eslint-disable-next-line fp/no-mutating-methods
			pendingUpdates.pop()

			const elements = document.querySelectorAll(`[hash="${elementHash}"]`)
			if (elements.length > 1) {
				console.error(`More than 1 component have the hash '${elementHash}'`)
			}
			else {
				const node = elements[0] as HTMLElement | undefined
				if (node !== undefined) {
					const cachedGenerator = cache[elementHash]
					const payload = await (cachedGenerator as unknown as AsyncGenerator)

					const nextElem = isAsyncIterable(payload)
						? (await (payload as unknown as AsyncGenerator).next()).value
						: await payload

					// The rendered element won't have a key attribute
					const renderedElem = await render(nextElem, elementHash)

					updateDOM(node as HTMLElement, renderedElem);

					// We put back the key on the node
					(node as HTMLElement).setAttribute("hash", elementHash)
				}
				else {
					console.error(`Cannot update an element: hash '${elementHash}' not found in the document`)
				}
			}
		})
	}, 50) as unknown as number
}

/** Returns a unique hash that is based on the key, props & children of a component
 * @param props The properties passed to the component, including children and key
 */
export const getHash = (props: Obj): string => {
	return hashSum(stringifyPropsByRefs(props))
}

/** A store of large objects and their reference, used to make the function 'stringifyPropsByRefs' faster */
const largeObjectMap = new Map()

/** Same as JSON.stringify, except that large property values (arrays & object with 50+ keys) are represented with pseudo-address references instead of JSON strings
 * The pseudo-adress references are obtained from the value of the global object "largeObjectMap".
 * @param obj The object to stringify
 */
export const stringifyPropsByRefs = (obj: Obj, recursions?: number): string => {
	// For each property, we return its stringified representation
	return obj === null
		? "null"
		: `{${Object.keys(obj).map(propsKey => {
			if (recursions && recursions > 20) {
				return `${propsKey}:"Max depth"`
			}
			const rawValue = obj[propsKey]
			switch (typeof rawValue) {
				case "function":
					{
						return `${propsKey}:"${rawValue.toString()}"`
					}
				case "object":
					{
						if (rawValue === null) {
							return `${propsKey}:null`
						}
						else if (Array.isArray(rawValue)) {
							if (rawValue.length > 50) {
								if (largeObjectMap.get(rawValue) === undefined) {
									largeObjectMap.set(rawValue, cuid.default())
								}
								return `${propsKey}:${largeObjectMap.get(rawValue)}`
							}
							else {
								// Objects in the array will be stringified, other values returned as is
								return `${propsKey}:[${rawValue.map(
									v =>
										typeof v === "object"
											? stringifyPropsByRefs(v, (recursions || 0) + 1)
											: v
								).join()}]`
							}
						}
						else if (Object.keys(rawValue).length > 50) {
							if (largeObjectMap.get(rawValue) === undefined) {
								largeObjectMap.set(rawValue, cuid.default())
							}
							return `${propsKey}:${largeObjectMap.get(rawValue)}`
						}
						else {
							return `${propsKey}:${stringifyPropsByRefs(rawValue as Obj, (recursions || 0) + 1)}`
						}
					}
				case "bigint":
				case "number":
				case "boolean":
					{
						return `${propsKey}:${rawValue.toString()}`
					}
				case "string":
				case "symbol":
					{
						return `${propsKey}:"${rawValue.toString()}"`
					}
				case "undefined":
					{
						return `${propsKey}:"undefined"`
					}
			}

		}).join()}}`
}