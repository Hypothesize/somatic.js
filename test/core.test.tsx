/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable fp/no-loops */
/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable init-declarations */

import * as assert from "assert"
import { unique, Array as Array__ } from "@sparkwave/standard"
import { createElement, render, renderToString } from '../dist/index.js'
import { idProvider } from '../dist/utils'
import { constructElement, normalizeHTML } from './utils'
import { stringifyPropsByRefs, getHash } from "../dist/core"
const jsdom = require('mocha-jsdom')
jsdom({ url: 'http://localhost', skipWindowCheck: true })

describe("Somatic", () => {
	describe("render", () => {
		it("should return element with same html as renderToString", async () => {
			// try {
			// 	//console.log(`Starting 'should return element with same html as renderToString' test`)
			// 	const vNode = <ToggleInput
			// 		icons={{ on: <span>On</span>, off: <span>Off</span> }}
			// 		style={{ height: "auto", width: "auto", fontSize: "14px" }}
			// 		postMsgAsync={async (msg) => { console.log('Message received' + msg.type) }}>
			// 	</ToggleInput>

			// 	const renderedHTML = (await render(vNode) as Element).outerHTML
			// 	//console.log(`renderedNodeHTML: ${renderedHTML}`)

			// 	idProvider.reset()
			// 	const renderedString = await renderToString(vNode)
			// 	//console.log(`renderedString: ${renderedString}`)

			// 	assert.equal(normalizeHTML(renderedHTML), normalizeHTML(renderedString))

			// }
			// catch (e) {
			// 	console.error(e)
			// }
		})

		/*it("should render element with the same text content", async () => {
			// We create a small div element with className and background color and pass it to the render function
			const node = <div className={'test'} style={{ backgroundColor: "blue" }}>{`test`}</div>
			const renderedNode = await render(node)

			// Attach the element to the dom container
			container?.appendChild(renderedNode)

			assert.equal(container?.children[0].textContent, 'test')
		})

		it("should render the element with its corresponding attributes", async () => {
			// We create a small div element with className and background color and pass it to the render function
			const node = <div className={'test-class'} style={{ backgroundColor: "blue" }}>{`test`}</div>
			const renderedNode = await render(node)

			// Attach the element to the dom container
			container?.appendChild(renderedNode)

			assert.equal(container?.children[0].getAttribute("class"), 'test-class')
		})*/
	})

	describe("stringifyPropsByRefs", () => {
		it("should return a proper string for single level objects", () => {
			const props = { color: "Blue", prices: [1, 2, 3], SKU: 1205, creation: new Date("2012-12-11T16:00:00.000Z").getTime() }
			const stringifiedProps = stringifyPropsByRefs(props)
			assert.strictEqual(stringifiedProps, '{color:"Blue",prices:[1,2,3],SKU:1205,creation:1355241600000}')
		})
		it("should works with 3 levels", async () => {
			const props = {
				myEmptyObj: {},
				myObj: { color: "Blue", onSale: false, prices: [1, 2, 3], insideObj: { prop1: 34, prop2: true }, SKU: 1205, creation: new Date("2012-12-11T16:00:00.000Z").getTime() }
			}
			const stringifiedProps = stringifyPropsByRefs(props)
			assert.strictEqual(stringifiedProps, '{myEmptyObj:{},myObj:{color:"Blue",onSale:false,prices:[1,2,3],insideObj:{prop1:34,prop2:true},SKU:1205,creation:1355241600000}}')
		})
		it("should works with array of objects", async () => {
			const props = {
				myEmptyObj: {},
				myObjArray: [
					{ color: "Blue", onSale: false, prices: [1, 2, 3], insideObj: { prop1: 34, prop2: true }, SKU: 1205, creation: new Date("2012-12-11T16:00:00.000Z").getTime() },
					{ color: "Blue", onSale: false, prices: [1, 2, 3], insideObj: { prop1: 34, prop2: true }, SKU: 1205, creation: new Date("2012-12-11T16:00:00.000Z").getTime() },
					null,
					null
				]
			}
			const stringifiedProps = stringifyPropsByRefs(props)
			assert.strictEqual(stringifiedProps, '{myEmptyObj:{},myObjArray:[{color:"Blue",onSale:false,prices:[1,2,3],insideObj:{prop1:34,prop2:true},SKU:1205,creation:1355241600000},{color:"Blue",onSale:false,prices:[1,2,3],insideObj:{prop1:34,prop2:true},SKU:1205,creation:1355241600000},null,null]}')
		})
		it("should turn large arrays (>50 items) into references", () => {
			const props = {
				prices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,],
				SKU: 1205
			}
			const stringifiedProps = stringifyPropsByRefs(props)
			assert.ok(stringifiedProps.length < 100)
		})
		it("should turn large objects (>50 keys) into references", () => {
			const props = {
				largeObj: { prop1: 1, prop2: 1, prop3: 1, prop4: 1, prop5: 1, prop6: 1, prop7: 1, prop8: 1, prop9: 1, prop10: 1, prop11: 1, prop12: 1, prop13: 1, prop14: 1, prop15: 1, prop16: 1, prop17: 1, prop18: 1, prop19: 1, prop20: 1, prop21: 1, prop22: 1, prop23: 1, prop24: 1, prop25: 1, prop26: 1, prop27: 1, prop28: 1, prop29: 1, prop30: 1, prop31: 1, prop32: 1, prop33: 1, prop34: 1, prop35: 1, prop36: 1, prop37: 1, prop38: 1, prop39: 1, prop40: 1, prop41: 1, prop42: 1, prop43: 1, prop44: 1, prop45: 1, prop46: 1, prop47: 1, prop48: 1, prop49: 1, prop50: 1, prop51: 1, prop52: 1, prop53: 1, prop54: 1, prop55: 1, prop56: 1, prop57: 1, prop58: 1, prop59: 1, prop60: 1 },
				SKU: 1205
			}
			const stringifiedProps = stringifyPropsByRefs(props)
			assert.ok(stringifiedProps.length < 100)
		})
		it("should return the same references at every call for large objects and arrays", () => {
			const props = {
				largeObj: { prop1: 1, prop2: 1, prop3: 1, prop4: 1, prop5: 1, prop6: 1, prop7: 1, prop8: 1, prop9: 1, prop10: 1, prop11: 1, prop12: 1, prop13: 1, prop14: 1, prop15: 1, prop16: 1, prop17: 1, prop18: 1, prop19: 1, prop20: 1, prop21: 1, prop22: 1, prop23: 1, prop24: 1, prop25: 1, prop26: 1, prop27: 1, prop28: 1, prop29: 1, prop30: 1, prop31: 1, prop32: 1, prop33: 1, prop34: 1, prop35: 1, prop36: 1, prop37: 1, prop38: 1, prop39: 1, prop40: 1, prop41: 1, prop42: 1, prop43: 1, prop44: 1, prop45: 1, prop46: 1, prop47: 1, prop48: 1, prop49: 1, prop50: 1, prop51: 1, prop52: 1, prop53: 1, prop54: 1, prop55: 1, prop56: 1, prop57: 1, prop58: 1, prop59: 1, prop60: 1 },
				largeArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				SKU: 1205
			}
			const firstStringification = stringifyPropsByRefs(props)
			assert.deepStrictEqual(firstStringification, stringifyPropsByRefs(props))
		})
		it("should find out if promises are similar", () => {
			const props = {
				promise: Promise.resolve("Blue"),
				SKU: 1205
			}
			const firstStringification = stringifyPropsByRefs(props)
			assert.deepStrictEqual(firstStringification, stringifyPropsByRefs(props))
		})

		it("should stop recursive stringification after 20 levels", () => {
			const manyRecursionObj = {
				SKU: 1205,
				recursive: {
					recursive: {
						recursive: {
							recursive: {
								recursive: {
									recursive: {
										recursive: {
											recursive: {
												recursive: {
													recursive: {
														recursive: {
															recursive: {
																recursive: {
																	recursive: {
																		recursive: {
																			recursive: {
																				recursive: {
																					recursive: {
																						recursive: {
																							color: "Orange",
																							recursive: {
																								color: "Green",
																								recursive: {
																									color: "Gray",
																									recursive: {
																										color: "Silver",
																										recursive: {
																											color: "Gold"
																										}
																									}
																								}
																							}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
			assert.deepStrictEqual(stringifyPropsByRefs(manyRecursionObj), `{SKU:1205,recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{recursive:{color:"Orange",recursive:{color:"Green",recursive:{color:"Max depth",recursive:"Max depth"}}}}}}}}}}}}}}}}}}}}}}`)
		})
	})
	describe("getHash", () => {
		it("Should return 1.000 different hash for 1.000 props varying by a number", () => {
			const thousandsProps = Array__.fromRange(0, 999).map(n => {
				return getHash({ color: "Blue", somNumber: n })
			})
			assert.deepStrictEqual([...unique(thousandsProps)].length, 1000)
		})
		it("Should return 1.000 different hash for 1.000 props varying by a letter", () => {
			const thousandsProps = Array__.fromRange(0, 999).map(n => {
				return getHash({ color: "Blue", someLetter: n.toString() })
			})
			assert.deepStrictEqual([...unique(thousandsProps)].length, 1000)
		})
	})

	/*describe('render', () => {
		it('renders correctly', () => {
			const tree = testRenderer
				.create(<a href="http://www.facebook.com" />)
				.toJSON()
			expect(tree).toMatchSnapshot()
		})

		test("simple", () => {
			expect(renderer.render(<h1>Hello world</h1>)).toEqual(
				"<h1>Hello world</h1>",
			)
		})

		test("multiple children", () => {
			expect(
				renderer.render(
					<div>
						<span>1</span>
						<span>2</span>
						<span>3</span>
						<span>4</span>
					</div>,
				),
			).toEqual(
				"<div><span>1</span><span>2</span><span>3</span><span>4</span></div>",
			)
		})

		test("nested children", () => {
			expect(
				renderer.render(
					<div id="1">
						<div id="2">
							<div id="3">Hi</div>
						</div>
					</div>,
				),
			).toEqual('<div id="1"><div id="2"><div id="3">Hi</div></div></div>')
		})

		test("boolean replaces nested children", () => {
			expect(
				renderer.render(
					<div id="1">
						<div id="2">
							<div id="3">Hi</div>
						</div>
					</div>,
				),
			).toEqual('<div id="1"><div id="2"><div id="3">Hi</div></div></div>')
		})

		test("attrs", () => {
			expect(
				renderer.render(
					<Fragment>
						<input id="toggle" type="checkbox" checked data-checked foo={false} />
						<label for="toggle" />
					</Fragment>,
				),
			).toEqual(
				'<input id="toggle" type="checkbox" checked data-checked><label for="toggle"></label>',
			)
		})

		test("styles", () => {
			expect(
				renderer.render(
					<Fragment>
						<div style={{ color: "red" }} />
						<img
							src="x"
							style={{ xss: 'foo;" onerror="alert(\'hack\')" other="' }}
						/>
					</Fragment>,
				),
			).toEqual(
				'<div style="color:red;"></div><img src="x" style="xss:foo;&quot; onerror=&quot;alert(&#039;hack&#039;)&quot; other=&quot;;">',
			)
		})

		test("null", () => {
			expect(renderer.render(null)).toEqual("")
		})

		test("fragment", () => {
			expect(
				renderer.render(
					<Fragment>
						<span>1</span>
						<span>2</span>
					</Fragment>,
				),
			).toEqual("<span>1</span><span>2</span>")
		})

		test("array", () => {
			expect(
				renderer.render(
					<div>
						<span>1</span>
						{[<span>2</span>, <span>3</span>]}
						<span>4</span>
					</div>,
				),
			).toEqual(
				"<div><span>1</span><span>2</span><span>3</span><span>4</span></div>",
			)
		})

		test("nested arrays", () => {
			expect(
				renderer.render(
					<div>
						<span>1</span>
						{[<span>2</span>, [<span>3</span>, <span>4</span>], <span>5</span>]}
						<span>6</span>
					</div>,
				),
			).toEqual(
				"<div><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>",
			)
		})

		test("keyed array", () => {
			const spans = [
				<span crank-key="2">2</span>,
				<span crank-key="3">3</span>,
				<span crank-key="4">4</span>,
			]
			expect(
				renderer.render(
					<div>
						<span>1</span>
						{spans}
						<span>5</span>
					</div>,
				),
			).toEqual(
				"<div><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>",
			)
		})

		test("escaped children", () => {
			expect(renderer.render(<div>{"< > & \" '"}</div>)).toEqual(
				"<div>&lt; &gt; &amp; &quot; &#039;</div>",
			)
		})

		test("raw html", () => {
			const html = '<span id="raw">Hi</span>'
			expect(
				renderer.render(
					<div>
						Raw: <Raw value={html} />
					</div>,
				),
			).toEqual('<div>Raw: <span id="raw">Hi</span></div>')
		})

		it("should return element with same html as renderToString() result, for a vnode without event handlers", async () => {
			const vNode = <FileInput
				theme={config.theme}
				labelStyle={{}}
				loadAs="array"
				content={<span style={{ fontSize: "1.25em", fontWeight: 900 }}>Get Started</span>}
				// onDataLoaded={async () => { console.log("file input data loaded") }}
				style={{ height: "auto", width: "auto", fontSize: "14px" }}>
			</FileInput>

			// Generating an element through render
			const elt = await render(vNode)
			const renderString = await renderToString(vNode)

			assert.equal(div.outerHTML, renderString)
		})

		it("should have the element with the events listeners attached to it", async () => {
			const vNode = <div className='test' onClick={() => console.log('')}>
				<span> Some render</span>
				<i>test</i>
			</div>

			// Generating an element through render
			const renderNode = await render(vNode)
			const fakeDivRender = document.createElement("div")
			while (fakeDivRender.firstChild) fakeDivRender.removeChild(fakeDivRender.firstChild)
			fakeDivRender.appendChild(renderNode)

			// Generating an element through renderToString
			const renderString = await renderToString(vNode)
			const fakeDivRenderToString = document.createElement("div")
			fakeDivRenderToString.innerHTML = renderString
			hydrate(fakeDivRenderToString)

			assert.ok(isEquivalent(fakeDivRender, fakeDivRenderToString))
		})
	})*/
})

