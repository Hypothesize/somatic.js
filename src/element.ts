import { Obj, hasValue, firstOrDefault, skip, last, shallowEquals, isGenerator, union, SequenceAsync, flatten } from "@sparkwave/standard"
import {
	Children,
	ComponentResult, ComponentEltAugmented,
	ComponentElement, UIElement, ValueElement, IntrinsicElement, /*FragmentElement,*/
	RenderingTrace
} from "./types"
import { getHierarchicalKey } from "./core"

export const isEltProper = <P extends Obj>(elt?: UIElement<P>): elt is (IntrinsicElement<P> | ComponentElement<P>) =>
	(hasValue(elt) && typeof elt === "object" && "type" in elt && (typeof elt.type === "string" || typeof elt.type === "function"))
export const isIntrinsicElt = <P extends Obj>(elt: UIElement<P>): elt is IntrinsicElement<P> => isEltProper(elt) && typeof elt.type === "string"
export const isFragmentElt = (elt: UIElement): elt is DocumentFragment => isEltProper(elt) && elt.type === ""
// export const isFragmentElt = (elt: UIElement): elt is FragmentElement => isEltProper(elt) && elt.type === ""
export const isComponentElt = <P extends Obj>(elt: UIElement<P>): elt is ComponentElement<P> => isEltProper(elt) && typeof elt.type !== "string"

/** Return a copy of a component element augmented with its invocation results
 * @param elt The input component element (possibly with a result member, which is recomputed)
 */
export async function updateResultAsync<P extends Obj = Obj>(elt: ComponentElement<P>): Promise<ComponentEltAugmented<P>> {
	const getNextAsync = async (generator: Generator<UIElement, UIElement> | AsyncGenerator<UIElement, UIElement>, newProps?: any): Promise<ComponentResult | undefined> => {
		// console.log(`generator elt.props: ${JSON.stringify(elt.props)}`)
		// We pass the key as a props to be used in the component generator
		let nextInfo = await generator.next({ ...newProps, uniqueKey: elt.props.uniqueKey })

		// If new props were passed, call next() on generator again so latest props is used
		if (hasValue(newProps)) nextInfo = await generator.next()

		const next: UIElement | undefined = (nextInfo.done === true)
			? undefined
			: nextInfo.value

		// We re-attach the key to the element
		if (typeof next === "object" && "props" in next && typeof next.props === "object") {
			next.props = { ...next.props, uniqueKey: elt.props.uniqueKey }

			// We re-attach the keys to its children
			if ("children" in next && Array.isArray(next.children)) {
				next.children = next.children.map((child: UIElement, i) => {
					if (isComponentElt(child)) {
						const uniqueKey = (isComponentElt(child) || isIntrinsicElt(child)) && "key" in child.props
							? getHierarchicalKey(child, elt.props.uniqueKey as string | undefined, i)
							: undefined
						return { ...child, props: { ...child.props, uniqueKey: uniqueKey } }
						// return child
					}
					else {
						return child
					}
				})
			}
		}
		return next !== undefined ? { generator, element: next } : undefined
	}

	const getResultAsync = async (): Promise<ComponentResult> => {
		if (elt.result && elt.result.generator) {
			const next = await getNextAsync(elt.result.generator, {
				...elt.props, children: elt.children
			})
			if (hasValue(next)) {
				return next
			}
			else {
				console.warn(`Component generator is done yielding values.\nThis situation is normally unintended, since generator components can yield values infinitely while responding to props changes`)
			}
		}

		const resultElt = await elt.type({ ...elt.props, children: elt.children })
		if (isGenerator(resultElt)) {
			// No need to inject props again since call to elt.type above already used them
			const next = await getNextAsync(resultElt)
			if (hasValue(next)) {
				return next
			}
			else {
				// Cannot use a generator component that does not yield at least one value
				throw new Error(`Component "${elt.type.name}" not yielding values.`)
			}
		}
		else {
			// We transmit the key to the result element
			if(isComponentElt(resultElt)){
				resultElt.props.uniqueKey = elt.props.uniqueKey
			}

			return { element: resultElt }
		}
	}

	return { ...elt, result: await getResultAsync() }
}

/** Render to leaf (intrinsic or value) element, returning the trace */
export async function traceToLeafAsync(eltUI: UIElement): Promise<RenderingTrace> {
	// let ret: RenderingTrace | undefined = undefined
	if (isComponentElt(eltUI)) {
		// console.log(`eltUI: ${JSON.stringify(eltUI)}`)

		const eltUIAugmented = eltUI.result ? eltUI as ComponentEltAugmented : await updateResultAsync(eltUI)
		// assert("uniqueKey" in eltUIAugmented.props, "Component element must have a uniqueKey prop")
		// console.log(`eltUIAugmented: ${JSON.stringify(eltUIAugmented)}`)

		const eltResult = eltUIAugmented.result.element

		if (isComponentElt(eltResult)) {
			const trace = await traceToLeafAsync(eltResult)
			// console.log(`leafElement1: ${JSON.stringify(trace.leafElement)}`)
			return { componentElts: [eltUIAugmented, ...trace.componentElts], leafElement: trace.leafElement }
		}
		else { // intrinsic or value element

			// If the result of the trace is an intrinsic element but it come from a component (eltUIAugmented has a key property), we attach the key
			if (isIntrinsicElt(eltResult)) {
				eltResult.props = { ...eltResult.props, ...eltUIAugmented.props.uniqueKey !== undefined ? { uniqueKey: eltUIAugmented.props.uniqueKey } : {} }
			}

			// console.log(`leafElement2: ${JSON.stringify(eltResult)}`)
			return { componentElts: [eltUIAugmented], leafElement: eltResult }
		}
	}
	else { // eltUI is intrinsic or a value
		// console.log(`leafElement3: ${JSON.stringify(eltUI)}`)
		return { componentElts: [], leafElement: eltUI }
	}
}

/** Gets leaf (intrinsic or value) element */
export async function getLeafAsync(eltUI: UIElement): Promise<IntrinsicElement | ValueElement> {
	if (isComponentElt(eltUI)) {
		const eltUIAugmented = eltUI.result ? eltUI as ComponentEltAugmented : await updateResultAsync(eltUI)
		const eltResult = eltUIAugmented.result.element

		if (isComponentElt(eltResult)) { // eltResult is a component element
			return (getLeafAsync(eltResult))/* ?? "" */
		}
		else { // eltResult is a leaf (intrinsic or value element)
			return eltResult/* ?? "" */
		}
	}
	else { // eltUI is already a leaf (intrinsic or a value)
		return eltUI/* ?? "" */
	}
}

/** Return an updated render-to-leaf trace, to reflect a changed state of the world. Does not mutate input trace
 * @param trace The original rendering trace to update. If intrinsic, it is returned as is.
 * @param eltComp A UI element that, if passed, is used as the starting point of the trace, instead of the trace's 1st element
 * @returns A promise of the updated trace
 */
export async function updateTraceAsync(trace: RenderingTrace, eltComp?: ComponentElement): Promise<RenderingTrace> {
	const firstElt = firstOrDefault(trace.componentElts)
	if (!firstElt) {
		return { ...trace } // trace does not contain any component element, i.e., it is already intrinsic
	}

	if (eltComp) {
		// We ensure that the uniqueKey of the first element of the trace is the same as the uniqueKey of the incoming elt
		eltComp.props = { ...eltComp.props, uniqueKey: firstElt.props.uniqueKey }

		if (firstElt.type !== eltComp.type) { // invariant check
			throw new Error(`updateTraceAsync: trace argument not compatible with component element argument`)
		}
		// Update the trace's 1st component element to match the incoming elt to be used as a starting point
		Object.assign(firstElt.props, eltComp.props)
		firstElt.children = eltComp.children
	}

	const initialAugElts: (Promise<ComponentEltAugmented> | null)[] = [updateResultAsync(firstElt)]
	const rendersAugmentedPromises = await new SequenceAsync(trace.componentElts)
		.skipAsync(1)
		.reduceAsync(initialAugElts, async (eltPromisesAccum, eltCurrent) => {
			const lastEltPromise = last(eltPromisesAccum)
			if (!hasValue(lastEltPromise)) { // Last element accumulated for trace must not be null (since the takeWhile combinator below excludes such)
				throw new Error(`Last element of accumulated trace is null in reducer`)
			}
			const eltResult = (await lastEltPromise).result.element
			if (isEltProper(eltResult) && eltResult.type === eltCurrent.type) {
				const childrenResult = getChildren(eltResult)
				const childrenCurr = getChildren(eltCurrent)

				const elt = (eltResult.type.isPure ?? false) && childrenCurr.length === 0 && childrenResult.length === 0 && shallowEquals(eltResult.props, eltCurrent.props)
					? Promise.resolve(eltCurrent) // no need to update results
					: updateResultAsync({
						...eltCurrent,
						props: eltResult.props,
						children: eltResult.children
					})
				return [...eltPromisesAccum, elt]
			}
			else {
				return [...eltPromisesAccum, null]
			}

			/*const elt = lastEltPromise.then(async lastElt => {
				const eltResult = lastElt.result.element
				if (isEltProper(eltResult) && eltResult.type === eltCurrent.type) {
					const childrenResult = getChildren(eltResult)
					const childrenCurr = getChildren(eltCurrent)

					return eltResult.type.isPure && childrenCurr.length === 0 && childrenResult.length === 0 && shallowEquals(eltResult.props, eltCurrent.props)
						? eltCurrent // no need to update results
						: updateResultAsync({
							...eltCurrent,
							props: eltResult.props,
							children: eltResult.children
						})
				}
				else {
					return null
				}
			})*/

			// return [...eltPromisesAccum, elt]
		})
		// Take while last elt promise accumulated not null (i.e continues to be compatible with the render trace)
		.takeWhileAsync(async eltPromises => last(eltPromises) !== null)
		.lastAsync()

	const rendersAugmented = await Promise.all(rendersAugmentedPromises) as ComponentEltAugmented[]

	const lastRendersAugmented = last(rendersAugmented)
	if (typeof lastRendersAugmented === "object" && typeof lastRendersAugmented.type === "undefined") {
		console.error("lastRendersAugmented is object but has no type property value, in updateTraceAsync")
	}

	const _trace = await traceToLeafAsync(lastRendersAugmented)
	return {
		componentElts: [...union([rendersAugmented, skip(_trace.componentElts, 1)])],
		leafElement: _trace.leafElement
	}
}

/** Returns a flattened array of children  */
export function normalizeChildren(children?: Children): UIElement<Obj<unknown, string>>[] {
	if (children === undefined) {
		return []
	}
	return Array.isArray(children)
		? [...flatten(children)]
		: [children]
}

/** Returns normalized children of an element  */
export function getChildren(elt: UIElement): UIElement<Obj<unknown, string>>[] {
	return isEltProper(elt) ? normalizeChildren(elt.children) : []
}
