//@ts-check

import { test } from "node:test";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

await import('jsdom-global').then(_ => _.default())
import { Set, except } from '@sparkwave/standard'

import { renderAsync } from "../dist/core.js"
import {
	createDOMShallow,
	updateDomShallow,
	getApexElements,
	setAttribute,
	truncateChildNodes,
	emptyContainer,
	isAugmentedDOM,
	isTextDOM
} from '../dist/dom.js'
import { traceToLeafAsync, isIntrinsicElt } from "../dist/element.js"

import { StackPanel, HoverBox, View } from "./components/index.mjs"


describe("DOM MODULE", function () {
	describe("isTextDOM", function () {
		it("should return true for a text DOM node", async function () {
			assert.strictEqual(isTextDOM(document.createTextNode("")), true)
		})
		it("should be false for a DOM element", async function () {
			assert.strictEqual(isTextDOM(document.createElement("div")), false)
		})
		it("should be false for an SVG Text element", async function () {
			assert.strictEqual(isTextDOM(document.createElementNS('http://www.w3.org/2000/svg', "text")), false)
		})
		it("should be false for a DOM element with attributes", async function () {
			const elt = document.createElement("div")
			elt.style.backgroundColor = "gray"
			elt.title = "title"
			assert.strictEqual(isTextDOM(elt), false)
		})
	})

	describe("isAugmentedDOM", function () {
		it("should return false for a text DOM node", async function () {
			assert.strictEqual(isAugmentedDOM(document.createTextNode("")), false)
		})
		it("should be false for a basic DOM element", async function () {
			assert.strictEqual(isAugmentedDOM(document.createElement("div")), false)
		})
		it("should be false for an SVG Text element", async function () {
			assert.strictEqual(isAugmentedDOM(document.createElementNS('http://www.w3.org/2000/svg', "text")), false)
		})
		it("should be false for a DOM element with attributes", async function () {
			const elt = document.createElement("div")
			elt.style.backgroundColor = "gray"
			elt.title = "title"
			assert.strictEqual(isAugmentedDOM(elt), false)
		})
		it("should be true for a DOM element augmented with the 'renderTrace' property", async function () {
			assert.strictEqual(isAugmentedDOM(Object.assign(document.createElement("div"), { renderTrace: { componentElts: [] } })), true)
		})
	})

	describe("setAttribute", function () {
		it("should set style attribute properly", function () {
			const elt = document.createElement("div")
			setAttribute(elt, "style", { position: "absolute", backgroundColor: "blue" })
			assert.strictEqual(elt.getAttribute("style"), "position: absolute; background-color: blue")

			setAttribute(elt, "style", {})
			assert.strictEqual(elt.getAttribute("style"), "")

		})

		it("should set SVG attributes properly", async function () {
			const svg = await renderAsync({
				type: "svg",
				props: {
					id: "Layer_1",
					xmlns: "http://www.w3.org/2000/svg",
					viewBox: "0 0 122.88 78.97"
				},
				children: [
					{ type: "title", children: ["logo"], props: {} },
					{
						type: "path",
						props: {
							fillRule: "evenodd",
							d: "M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z"

						}
					}
				]
			})
			assert(isAugmentedDOM(svg))
			assert(svg.tagName.toUpperCase() === "SVG")

			setAttribute(svg, "preserveAspectRatio", 'xMidYMid meet')
			assert.strictEqual(svg.getAttribute("preserveAspectRatio"), 'xMidYMid meet')

			setAttribute(svg, "viewBox", "0 0 122.88 78.97")
			assert.strictEqual(svg.getAttribute("viewBox"), "0 0 122.88 78.97")

			assert.strictEqual(svg.children.length, 2)
			assert.strictEqual(svg.children.item(1)?.getAttribute("fill-rule"), "evenodd")

		})

		it("should set svg attributes such that they are properly reflected in html", async function () {
			const svg = document.createElementNS('http://www.w3.org/2000/svg', "svg")
			setAttribute(svg, "preserveAspectRatio", 'xMidYMid meet')

			const path = document.createElementNS('http://www.w3.org/2000/svg', "path")
			setAttribute(path, "readOnly", "true")

			const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
			group.setAttribute("transform", "matrix(0.660991,0,0,0.655918,524.665,744.892)")

			const pathD = "M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z"
			setAttribute(path, "fillRule", "evenodd")
			setAttribute(path, "d", pathD)

			svg.appendChild(path)
			svg.appendChild(group)

			assert.strictEqual(svg.outerHTML, '<svg preserveAspectRatio="xMidYMid meet"><path readOnly="true" fill-rule="evenodd" d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z"></path><g transform="matrix(0.660991,0,0,0.655918,524.665,744.892)"></g></svg>')
		})

		it("should set class/classname attribute properly", function () {
			const div = document.createElement("div")
			setAttribute(div, "class", "class1 class2")
			assert(div.classList.contains("class2"))

			setAttribute(div, "className", "")
			assert(!div.classList.contains("class2"))
		})

		it("should convert camel-cased attributes to their dash-case html equivalents in the output", function () {
			const form = document.createElement("form")
			setAttribute(form, "acceptCharset", "utf-8")
			assert.strictEqual(form.getAttribute("accept-charset"), "utf-8")
			assert.strictEqual(form.acceptCharset, "utf-8")

			const meta = document.createElement("meta")
			setAttribute(meta, "httpEquiv", "refresh")
			assert.strictEqual(meta.getAttribute("http-equiv"), "refresh")
			assert.strictEqual(meta.httpEquiv, "refresh")
		})

		it("should set boolean/no-value attributes properly", async function () {
			const input = document.createElement("input")
			const option = document.createElement("option")
			setAttribute(input, "type", "radio")

			setAttribute(input, "DISABLED", "disabled")
			assert(input.disabled, "The input should be disabled") // Any non-empty string would count as the boolean being true

			setAttribute(input, "disabled", "")
			assert(input.disabled, "Boolean attribute removed by setting to empty string")

			setAttribute(input, "disabled", false)
			assert(!input.disabled, "Boolean attribute not removed by setting to false")

			setAttribute(input, "checked", "")
			assert(input.checked, "Boolean attribute removed by setting to empty string")

			setAttribute(input, "checked", undefined)
			assert(!input.checked, "Boolean attribute not removed by setting to undefined")

			const select = document.createElement("select")
			setAttribute(select, "required", true)
			assert(select.required)
			setAttribute(select, "required", false)
			assert(!select.required)
			setAttribute(select, "required", "required")
			assert(select.required)

			const textArea = document.createElement("textarea")

			setAttribute(textArea, "readOnly", true)
			assert(textArea.readOnly)

			setAttribute(option, "selected", true)
			assert(option.selected, "Option is selected")

			setAttribute(option, "selected", false)
			assert.notStrictEqual(option.selected, true, "Option is not selected")
		})
	})

	describe("createDOMShallow", function () {
		it("should return a DOM element matching the input intrinsic element", async function () {
			const dom = createDOMShallow({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: ["val"]
			})

			assert(!(isTextDOM(dom) || (dom instanceof DocumentFragment)))

			assert.strictEqual(dom.tagName.toUpperCase(), "DIV")
			assert.strictEqual(String(dom.className).toUpperCase(), "CLSS")
			assert.deepStrictEqual(dom.getAttribute("style"), `background-color: blue`)

			// children should not have been attached yet
			assert.strictEqual(dom.childNodes.length, 0)
		})
		it("should return an SVG element matching the input intrinsic element", async function () {
			// <g transform="matrix(0.660991,0,0,0.655918,524.665,744.892)" >
			// 	<rect x="690.935" y="975.898" width="967.715" height="859.801" fill="none" ></rect>
			// </g >

			const dom = createDOMShallow({
				type: "g",
				props: { transform: "matrix(0.660991,0,0,0.655918,524.665,744.892)" },
				children: [{
					type: "rect",
					props: { x: "690.935", y: "975.898", width: "967.715", height: "859.801", fill: "none" },
					children: ["val"]
				}]
			})

			assert(!(isTextDOM(dom) || (dom instanceof DocumentFragment)))

			assert.strictEqual(dom.tagName.toUpperCase(), "G")
			// assert.strictEqual(String(dom.className).toUpperCase(), "CLSS")

			// console.log(dom.transform)
			assert.deepStrictEqual(dom.getAttribute("transform"), `matrix(0.660991,0,0,0.655918,524.665,744.892)`)
			assert.strictEqual(dom.childNodes.length, 0)
		})
		it("should return a text DOM element with content set to the input primitive value", async function () {
			const text = createDOMShallow(1)
			assert(isTextDOM(text))
			assert.strictEqual(text.textContent, "1")
			assert.strictEqual(text.childNodes.length, 0) // text should not have any children
		})
		it("should return a text DOM element with empty content when passed an empty string", async function () {
			const text = createDOMShallow("")
			assert(isTextDOM(text))
			assert.strictEqual(text.textContent, "")
			assert.strictEqual(text.childNodes.length, 0)
		})
	})

	describe("updateDOMShallow", function () {
		it("should update original DOM to match input intrinsic with matching tag", async function () {
			const dom1 = createDOMShallow({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: ["val"]
			})
			assert(!(isTextDOM(dom1) || (dom1 instanceof DocumentFragment)))

			assert.strictEqual(dom1.tagName.toUpperCase(), "DIV")
			assert(dom1.classList.contains("clss"))
			assert.deepStrictEqual(dom1.getAttribute("style"), `background-color: blue`)
			assert.strictEqual(dom1.childNodes.length, 0)

			const dom2 = updateDomShallow(dom1, {
				type: "div",
				props: { style: { backgroundColor: "yellow" }, title: "hello" },
				children: []
			})

			assert(dom1 === dom2)
			assert(!isTextDOM(dom2))
			assert.strictEqual(dom2.tagName.toUpperCase(), "DIV")
			assert(!dom2.classList.contains("clss"))
			assert.deepStrictEqual(dom2.getAttribute("style"), `background-color: yellow`)
			assert.deepStrictEqual(dom2.getAttribute("title"), `hello`)
			assert.strictEqual(dom2.childNodes.length, 0)
		})

		it("should create new DOM to match input intrinsic without matching tag", async function () {
			const div = createDOMShallow({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: ["val"]
			})
			assert(!(isTextDOM(div) || (div instanceof DocumentFragment)))

			assert.strictEqual(div.tagName.toUpperCase(), "DIV")
			assert(div.classList.contains("clss"))
			assert.deepStrictEqual(div.getAttribute("style"), `background-color: blue`)
			assert.strictEqual(div.childNodes.length, 0)

			const span = updateDomShallow(div, {
				type: "span",
				props: { style: { backgroundColor: "yellow", display: "inline-block" } },
				children: []
			})

			assert(div !== span)
			assert(!(isTextDOM(span) || (span instanceof DocumentFragment)))
			assert.strictEqual(span.tagName.toUpperCase(), "SPAN")
			assert(!span.classList.contains("clss"))
			assert.deepStrictEqual(span.getAttribute("style"), `background-color: yellow; display: inline-block`)
			assert.strictEqual(span.childNodes.length, 0)


			const trace = await traceToLeafAsync({
				type: StackPanel,
				props: { orientation: "horizontal" },
				children: [
					{ type: View, props: { sourceData: [], orientation: "vertical" } },
					{ type: HoverBox, children: ["Hello"] },
					{ type: "a" },
				]
			})
			assert(isIntrinsicElt(trace.leafElement))
			assert.strictEqual(trace.leafElement.type.toUpperCase(), "DIV")
			const divNew = updateDomShallow(span, trace.leafElement)
			// assert(isAugmentedDOM(divNew))
			assert.strictEqual(divNew.tagName.toUpperCase(), "DIV")
			assert.strictEqual(divNew.style.flexDirection, "row")
		})

		it("should create a text DOM with content set to input primitive value", async function () {
			const span = createDOMShallow({
				type: "span",
				props: { style: { backgroundColor: "yellow", display: "inline-block" } },
				children: []
			})
			assert(!(isTextDOM(span) || (span instanceof DocumentFragment)))

			const text = updateDomShallow(span, 1)
			assert(span !== text)
			assert(isTextDOM(text))
			assert.strictEqual(text.textContent, "1")
			assert.strictEqual(text.childNodes.length, 0) // text should not have any children
		})
	})

	describe("emptyContainer", function () {
		it("should leave a non-container DOM element empty", async function () {
			const elt = document.createElement("input")
			elt.type = "email"
			emptyContainer(elt)
			assert.strictEqual(elt.childNodes.length, 0)
		})
		it("should leave an empty DOM element empty", async function () {
			const elt = document.createElement("span")
			emptyContainer(elt)
			assert.strictEqual(elt.childNodes.length, 0)
		})
		it("should work for a DOM text node", async function () {
			const node = document.createTextNode("")
			assert.doesNotThrow(() => {
				emptyContainer(node)
			})
			assert.strictEqual(isTextDOM(node), true)
		})
		it("should empty a DOM element with nested children", async function () {
			const elt = document.createElement("div")
			elt.style.backgroundColor = "gray"
			elt.title = "title"
			const child = document.createElement("table")
			child.appendChild(document.createElement("tr"))

			elt.appendChild(child)
			elt.appendChild(document.createTextNode("ahoy"))

			assert.strictEqual(elt.childNodes.length, 2)

			emptyContainer(elt)
			assert.strictEqual(elt.childNodes.length, 0)
		})
	})

	describe("truncateChildNodes", function () {
		it("should leave a non-container DOM element empty", async function () {
			const elt = document.createElement("input")
			elt.type = "email"
			truncateChildNodes(elt, 7)
			assert.strictEqual(elt.childNodes.length, 0)
		})
		it("should leave an empty DOM element empty", async function () {
			const elt = document.createElement("span")
			truncateChildNodes(elt, 4)
			assert.strictEqual(elt.childNodes.length, 0)
		})
		it("should work for a DOM text node", async function () {
			const node = document.createTextNode("")
			assert.doesNotThrow(() => { truncateChildNodes(node, 1) })
			assert.strictEqual(isTextDOM(node), true)
		})
		it("should remove correct position and number of child nodes from a DOM element", async function () {
			const elt = document.createElement("div")
			elt.style.backgroundColor = "gray"
			elt.title = "title"
			const child = document.createElement("table")
			child.appendChild(document.createElement("tr"))

			elt.appendChild(child)
			elt.appendChild(document.createTextNode("ahoy"))

			assert.strictEqual(elt.childNodes.length, 2)

			truncateChildNodes(elt, 1)
			assert.strictEqual(elt.childNodes.length, 1)
			const x = (elt.childNodes.item(0))
			assert("tagName" in x && typeof x.tagName === "string")
			assert.strictEqual(x.tagName.toUpperCase(), "TABLE")
		})
		it("should empty a DOM element if the new children length passed is zero", async function () {
			const elt = document.createElement("div")
			elt.style.backgroundColor = "gray"
			elt.title = "title"
			const child = document.createElement("table")
			child.appendChild(document.createElement("tr"))

			elt.appendChild(child)
			elt.appendChild(document.createTextNode("ahoy"))

			assert.strictEqual(elt.childNodes.length, 2)

			truncateChildNodes(elt, 0)
			assert.strictEqual(elt.childNodes.length, 0)
		})
	})

	describe("getApexElements", function () {
		it("should return empty array when passed no element", function () {
			assert.deepStrictEqual(getApexElements([]), [])
		})
		it("should return the single element passed to it", function () {
			const div = document.createElement("div")
			assert.deepStrictEqual(getApexElements([div]), [div])
		})
		it("should return the single element passed to it", function () {
			const rootDiv1 = document.createElement("div")

			const rootDiv1Span1 = document.createElement("span")
			rootDiv1.appendChild(rootDiv1Span1)
			const rootDiv1Img1 = document.createElement("img")
			rootDiv1.appendChild(rootDiv1Img1)

			const childDiv = document.createElement("div")
			const para = document.createElement("p")
			para.appendChild(document.createElement("span"))
			para.appendChild(document.createElement("span"))

			childDiv.appendChild(para)
			childDiv.appendChild(document.createElement("button"))

			rootDiv1.appendChild(childDiv)

			const rootPara = document.createElement("p")

			const rootDiv2 = document.createElement("div")
			rootDiv2.appendChild(document.createElement("label"))
			rootDiv2.appendChild(document.createElement("input"))
			rootDiv2.appendChild(document.createElement("button"))

			const expected = [rootPara, rootDiv1, rootDiv2]
			assert(Set.equals(getApexElements(
				[
					rootDiv1,
					childDiv,
					rootPara,
					para,
					rootDiv2
				]
			), expected))

			assert(Set.equals(getApexElements(
				[
					rootDiv1Img1,
					rootDiv1,
					childDiv,
					rootPara,
					rootDiv1Span1,
					para,
					rootDiv2
				]
			), expected))

		})
	})
})


