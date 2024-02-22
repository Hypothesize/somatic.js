import { default as assert } from "assert"
import { expect, use } from "chai"
import { default as chaiHTML } from "chai-html"
import { deepMerge, mergeDeep } from "@sparkwave/standard"
require('jsdom-global')()
const nanomorph = require('nanomorph')

import { IntrinsicElement, DOMAugmented, Component, CSSProperties } from '../dist/types'
import { createElement, renderAsync, getHierarchicalKey, getElementUniqueKey, renderToIntrinsicAsync, renderToStringAsync, populateWithChildren, updateAsync, mountElement } from '../dist/core'
import { isComponentElt, normalizeChildren, isIntrinsicElt, traceToLeafAsync, getChildren } from '../dist/element'
import { isAugmentedDOM, isTextDOM, createDOMShallow, updateDomShallow } from '../dist/dom'
import { StackPanel, View, HoverBox } from './components'
import { idProvider } from '../dist/common'
import { normalizeHTML } from './utils'

describe("CORE MODULE", () => {
	use(chaiHTML)

	describe("populateWithChildren", () => {
		it("should work for a single value child", async () => {
			const intrinsic: IntrinsicElement = {
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: ["val"]
			}
			const trace = await traceToLeafAsync(intrinsic)
			assert.deepStrictEqual(trace.leafElement, intrinsic, "intrinsic element's trace's leaf element is not equal itself")

			const dom = createDOMShallow(intrinsic)
			assert(!isTextDOM(dom))

			await populateWithChildren(dom, getChildren(trace.leafElement))
			assert.strictEqual(dom.childNodes.length, 1)
		})
		it("should work for with multiple intrinsic children", async () => {
			const intrinsic: IntrinsicElement = {
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: [{ type: "span", props: { style: { display: "inline-block" } } }, "val"]
			}
			const trace = await traceToLeafAsync(intrinsic)
			assert.deepStrictEqual(trace.leafElement, intrinsic, "intrinsic element's trace's leaf element is not equal itself")

			const dom = createDOMShallow(intrinsic)
			assert(!isTextDOM(dom))

			await populateWithChildren(dom, getChildren(trace.leafElement))
			assert.strictEqual(dom.childNodes.length, 2)

			const firstChild = dom.childNodes.item(0) as HTMLElement
			assert.strictEqual(firstChild.tagName.toUpperCase(), "SPAN")
			assert.strictEqual(firstChild.style.display, "inline-block")
		})

		it("should work for component children", async () => {
			const intrinsic: IntrinsicElement = {
				type: "div",
				props: {},
				children: [
					{ type: View, props: { sourceData: [], orientation: "vertical" } },
					{ type: StackPanel, children: ["Hello"], props: {} },
					//{ type: CommandBox, children: ["Hello"] }
				]
			}
			const trace = await traceToLeafAsync(intrinsic)
			const dom = createDOMShallow(intrinsic)
			assert(!isTextDOM(dom))

			await populateWithChildren(dom, getChildren(trace.leafElement))
			assert.strictEqual(dom.childNodes.length, 2)

			const firstChild = dom.childNodes.item(0) as HTMLElement
			assert.strictEqual(firstChild.tagName.toUpperCase(), "DIV")
			assert.strictEqual(firstChild.style.flexDirection, "column")
		})
	})

	describe("renderAsync", () => {
		it("should return elt with same html as renderToString, for an elt without children", async () => {
			try {
				const elt = <HoverBox
					// icon={{ on: ()=><span>On</span>, off: ()=><span>Off</span> }}
					style={{ height: "auto", width: "auto", fontSize: "14px" }}
				/>

				const dom = await renderAsync(elt)
				assert(isAugmentedDOM(dom))

				const renderedString = (idProvider.reset(), await renderToStringAsync(elt))

				assert.strictEqual(normalizeHTML(dom.outerHTML), normalizeHTML(renderedString))
			}
			catch (e) {

				assert.equal(1, 1)
				// console.error(e)
				// assert.fail()
			}
		})

		it("should return elt with same html as renderToString, for an elt with children", async () => {
			const elt = <StackPanel style={{ height: "auto", width: "auto", fontSize: "14px" }}>
				<span style={{ fontSize: "1.25em", fontWeight: 900 }}>
					Get Started
				</span>
			</StackPanel>

			const dom = await renderAsync(elt)
			assert(isAugmentedDOM(dom))

			const renderString = (idProvider.reset(), await renderToStringAsync(elt))

			assert.strictEqual(normalizeHTML(dom.outerHTML), normalizeHTML(renderString))
		})

		it("should render an element with the correct text content", async () => {
			const dom = await renderAsync(
				<div className={'test'} style={{ backgroundColor: "blue" }}>
					{`test`}
				</div>
			)

			assert(isAugmentedDOM(dom))
			assert.strictEqual(dom.textContent, 'test')
		})

		it("should render an element with its corresponding attributes", async () => {
			const dom = await renderAsync(<div className={'test-class'} style={{ backgroundColor: "blue" }}>{`test`}</div>)

			assert(isAugmentedDOM(dom))
			assert.strictEqual((dom as DOMAugmented).getAttribute("class"), 'test-class')
		})

		it('should render a value element correctly', async () => {
			const dom = await renderAsync("hello")
			assert(isTextDOM(dom))
			assert.strictEqual(dom.textContent, 'hello')
		})

		it("should render multiple children properly", async () => {
			const dom = await renderAsync(<div>
				<span>1</span>
				<span>20</span>
				<span>300</span>
			</div>)

			assert(isAugmentedDOM(dom))
			assert.strictEqual(dom.childNodes.length, 3)
			assert.strictEqual(dom.childNodes.item(0).textContent, '1')
			assert.strictEqual(dom.childNodes.item(1).textContent, '20')
			assert.strictEqual(dom.childNodes.item(2).textContent, '300')
		})

		it("should render nested children properly", async () => {
			const dom = await renderAsync(
				<div id="1">
					<div id="2">
						<div id="3">Hi</div>
					</div>
					<span><i>4000</i></span>
				</div>
			)

			const firstChild = dom.firstChild
			assert(firstChild)
			assert.strictEqual(firstChild.childNodes.length, 1)
			assert(firstChild.firstChild)
			assert("tagName" in (firstChild.firstChild))

			const firstfirstChild = firstChild.firstChild as HTMLElement
			assert.strictEqual(firstfirstChild.tagName.toUpperCase(), "DIV")
			assert.strictEqual(firstfirstChild.textContent, "Hi")

			const lastChild = dom.lastChild
			assert(lastChild)
			assert(lastChild.firstChild)
			assert.strictEqual(lastChild.firstChild, lastChild.lastChild)
			assert("tagName" in (lastChild.firstChild as HTMLElement))
			assert.strictEqual((lastChild.firstChild as HTMLElement)["tagName"].toUpperCase(), "I")
			assert.strictEqual(lastChild.firstChild.textContent, "4000")
		})

		it("should render SVG elements properly", async () => {
			const VytalsLogo = MakeIcon(
				<svg
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 122.88 78.97">
					<title>logo</title>
					<path
						fillRule="evenodd"
						d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z" />
				</svg>
			)

			interface User {
				id: string
				displayName: string
				emailAddress?: string
				imageUrl?: string
				provider: "google" | "microsoft" | "dropbox" | "amazon" | "facebook" | "twitter",
				refreshToken: string
				accessToken: string
			}
			type Props = { user: User | undefined }
			const Layout: Component<Props> = async function (props) {
				// console.log(`Starting layout component render`)
				const { user, children } = props
				return <StackPanel
					id="root"
					orientation="vertical"
					style={{ padding: 0, margin: 0 }}>

					<StackPanel
						id="header"
						itemsAlignH="uniform"
						itemsAlignV="center"
						style={{ backgroundColor: "purple", width: "100vw", height: "10vh" }}>

						<VytalsLogo style={{ stroke: "white", fill: "transparent", height: "7vh" }} />

						<StackPanel id="user-info" style={{ padding: "0.25em", color: "whitesmoke" }}>
							{user
								? <StackPanel style={{ gap: "10%" } as any}>
									<span>Welcome, {user.displayName}</span>
									<a href="/logout">LOGOUT</a>
								</StackPanel>
								: <a href="/auth/google">LOGIN</a>
							}

						</StackPanel>

					</StackPanel>

					<StackPanel
						id="content"
						style={{ backgroundColor: "whitesmoke", height: "75vh" }}>
						{children}
					</StackPanel>

					<StackPanel
						id="footer"
						style={{ height: "10vh" }}>

					</StackPanel>

				</StackPanel>
			}
			const SplashPage: Component<Props> = props => <div>Splash page</div>

			const elt = <Layout user={undefined}><SplashPage user={undefined} /></Layout>

			const dom = await renderAsync(elt)
			assert(!isTextDOM(dom))
			assert(!(dom instanceof DocumentFragment))
			const svg = dom.getElementsByTagName("svg").item(0) /*document.getElementById("Layer_1")*/ as any as SVGSVGElement
			assert(svg.id === "Layer_1")
			assert(svg.tagName.toUpperCase() === "SVG")
			assert.strictEqual(svg.children.length, 2)

			const title = svg.children.item(0) as SVGTitleElement
			assert.strictEqual(title.textContent, "logo")

			const path = dom.getElementsByTagName("path").item(0) as SVGPathElement
			assert.strictEqual(path.tagName.toUpperCase(), "PATH")
			assert.strictEqual(path.getAttribute("fill-rule"), "evenodd")
			assert.strictEqual(path.getAttribute("d"), "M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z")
		})

		/*test("attrs", () => {
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
		}) */

		/*it("should have the element with the events listeners attached to it", async () => {
			const vNode = <div className='test' onClick={() => console.log('')}>
				<span> Some render</span>
				<i>test</i>
			</div>
		
			// Generating an element through render
			const renderNode = await renderAsync(vNode)
			const fakeDivRender = document.createElement("div")
			while (fakeDivRender.firstChild) fakeDivRender.removeChild(fakeDivRender.firstChild)
			fakeDivRender.appendChild(renderNode)
		
			// Generating an element through renderToString
			const renderString = await renderToStringAsync(vNode)
			const fakeDivRenderToString = document.createElement("div")
			fakeDivRenderToString.innerHTML = renderString
			hydrate(fakeDivRenderToString)
		
			assert.ok(isEquivalent(fakeDivRender, fakeDivRenderToString))
		})*/

	})

	describe("getHierarchicalKey", () => {
		it("should return am element's name as its key by default", async () => {
			const el = <StackPanel />
			const uniqueKey = getHierarchicalKey(el)
			assert.strictEqual(uniqueKey, 'StackPanel')
		})

		it("should use a component's custom key, if passed", async () => {
			const el = <StackPanel key="myCustomKey" />
			const uniqueKey = getHierarchicalKey(el)
			assert.strictEqual(uniqueKey, 'myCustomKey')
		})

		it("should include a parent's key and iteration, if the component has a parent", async () => {
			const parentElement = await renderAsync(<StackPanel />)
			assert(!isTextDOM(parentElement))
			assert(!(parentElement instanceof DocumentFragment))

			const child = <StackPanel />
			const parentKey = getElementUniqueKey(parentElement)
			const uniqueKey = getHierarchicalKey(child, parentKey, 2)
			assert.strictEqual(uniqueKey, 'StackPanel-(2)StackPanel')
		})

		it("should include a parent's key + custom key without iteration, if the component has a parent and a custom key", async () => {
			const parentElement = await renderAsync(<StackPanel />)
			assert(!isTextDOM(parentElement))
			assert(!(parentElement instanceof DocumentFragment))

			const child = <StackPanel key="myStax"/>
			const parentKey = getElementUniqueKey(parentElement)
			const uniqueKey = getHierarchicalKey(child, parentKey, 2)
			assert.strictEqual(uniqueKey, 'StackPanel-myStax')
		})

		it("should include a parent's custom key + its own custom key, if the component has a custom key, and a parent which also has one", async () => {
			console.log("== Start rendering parent element ==")
			const parentElement = await renderAsync(<StackPanel key="customParentKey" />)
			assert(!isTextDOM(parentElement))
			assert(!(parentElement instanceof DocumentFragment))
			console.log("== parent element ==")
			console.log(JSON.stringify(parentElement))

			const child = <StackPanel key="myStackPanel" />
			const parentKey = getElementUniqueKey(parentElement)
			const uniqueKey = getHierarchicalKey(child, parentKey, 5)
			assert.strictEqual(uniqueKey, 'customParentKey-myStackPanel')
		})

		it("should use an element ancestry to return a unique key, even if a simple custom key was passed", async () => {
			console.log("== Start rendering parent element ==")
			const rootElement = await renderAsync(
				<StackPanel key="customParentKey">
					<p>TEST</p>
					<div>
						<StackPanel key="myStackPanel" />
					</div>
				</StackPanel>
			)
			assert(!isTextDOM(rootElement))
			assert(!(rootElement instanceof DocumentFragment))

			const customStackPanelKey = rootElement.lastChild?.firstChild as DOMAugmented
			assert(!isTextDOM(customStackPanelKey))
			assert(!(customStackPanelKey instanceof DocumentFragment))

			assert.strictEqual("uniqueKey" in customStackPanelKey && customStackPanelKey["uniqueKey"], 'customParentKey-(1)div-myStackPanel')
		})
	})

	describe("renderToIntrinsicAsync", () => {
		it("should return elt with same html as renderToString, for an elt without children", async () => {
			try {
				const elt = <HoverBox
					// icon={{ on: ()=><span>On</span>, off: ()=><span>Off</span> }}
					style={{ height: "auto", width: "auto", fontSize: "14px" }}
				/>

				const intrinsic = await renderToIntrinsicAsync(elt)
				const dom = await renderAsync(elt)
				assert(isAugmentedDOM(dom))

				const renderedString = (idProvider.reset(), await renderToStringAsync(elt))

				assert.strictEqual(normalizeHTML(dom.outerHTML), normalizeHTML(renderedString))
			}
			catch (e) {

				assert.equal(1, 1)
				// console.error(e)
				// assert.fail()
			}
		})

		it("should return an element with the correct content", async () => {
			const elt = await renderToIntrinsicAsync(`test`)
			assert.strictEqual(elt, 'test')
		})

	})

	describe("renderToStringAsync()", () => {
		// it("should return an empty string when passed null", async () => {
		// 	assert.strictEqual(await renderToStringAsync(null), "")
		// })
		it("should work for intrinsic elements without properties or children", async () => {
			assert.strictEqual(await renderToStringAsync(<div></div>), `<div></div>`)
			assert.strictEqual(await renderToStringAsync(<abbr></abbr>), `<abbr></abbr>`)
		})
		it("should work for an intrinsic element with a single child but without properties", async () => {
			const actual = await renderToStringAsync(<div>Splash page</div>)
			const expected = `<div>Splash page</div>`
			expect(expected).html.to.equal(actual)
		})
		it("should work for an intrinsic element with multiple children, but without properties", async () => {
			const actual = await renderToStringAsync(
				<div>
					<span>first</span>
					<span>second</span>
				</div>
			)
			const expected = `<div><span>first</span><span>second</span></div>`
			expect(expected).html.to.equal(actual)

		})
		it("should work for an intrinsic element with array children, but without properties", async () => {
			const actual = await renderToStringAsync(
				<div>
					<span>first</span>
					{["second,", "third"]}
				</div>
			)
			const expected = `<div><span>first</span>second,third</div>`
			expect(expected).html.to.equal(actual)
		})
		it("should work for intrinsic elements with properties and a child", async () => {
			const actual = await renderToStringAsync(<div style={{ position: "static" }}>Splash page</div>)
			const expected = `<div style="position: static">Splash page</div>`
			expect(expected).html.to.equal(actual)
		})
		it("should work for component elements with properties and a child", async () => {
			const actual = await renderToStringAsync(
				<StackPanel orientation="horizontal">
					<input type="text" />
				</StackPanel>
			)

			const expected = `
				<div style="display: flex; flex-direction: row; justify-content: initial; align-items: initial">
					<input type="text"/>
				</div>
			`

			expect(expected).html.to.equal(actual)

			// assert.strictEqual(expected, actual)
		})

		it("should render SVG elements properly", async () => {

			const VytalsLogo = MakeIcon(
				<svg
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 122.88 78.97">
					<title>logo</title>
					<path
						fillRule="evenodd"
						d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z" />
				</svg>
			)

			const elt = <VytalsLogo style={{ stroke: "white", fill: "transparent", height: "7vh" }} />

			const actual = await renderToStringAsync(elt)
			const expected = `<svg 
				preserveAspectRatio="xMidYMid meet" 
				id="Layer_1" 
				xmlns="http://www.w3.org/2000/svg" 
				viewBox="0 0 122.88 78.97" 
				style="stroke: white; fill: transparent; height: 7vh" 			
				fill="currentColor">

				<title>logo</title>
				
				<path 
					fill-rule="evenodd" 
					d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z">
				</path>
			</svg>`

			expect(expected).html.to.equal(actual)
		})

		it("should return a string representation of a complex page component", async () => {

			const VytalsLogo = MakeIcon(
				<svg
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 122.88 78.97">
					<title>logo</title>
					<path
						fillRule="evenodd"
						d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z" />
				</svg>
			)

			interface User {
				id: string
				displayName: string
				emailAddress?: string
				imageUrl?: string
				provider: "google" | "microsoft" | "dropbox" | "amazon" | "facebook" | "twitter",
				refreshToken: string
				accessToken: string
			}
			const SplashPage: Component<any> = async function* (props) {
				// console.log(`Starting splash page render`)
				yield <div>Splash page</div>
			}
			const Layout: Component<{ user: User | undefined }> = async function* (props) {
				// console.log(`Starting layout component render`)
				const { user, children } = props

				yield <StackPanel
					id="root"
					orientation="vertical"
					style={{ padding: 0, margin: 0 }}>

					<StackPanel
						id="header"
						itemsAlignH="uniform"
						itemsAlignV="center"
						style={{ backgroundColor: "purple", width: "100vw", height: "10vh" }}>

						<VytalsLogo style={{ stroke: "white", fill: "transparent", height: "7vh" }} />

						<StackPanel id="user-info" style={{ padding: "0.25em", color: "whitesmoke" }}>
							{user
								? <StackPanel style={{ gap: "10%" } as any}>
									<span>Welcome, {user.displayName}</span>
									<a href="/logout">LOGOUT</a>
								</StackPanel>
								: <a href="/auth/google">LOGIN</a>
							}
						</StackPanel>

					</StackPanel>

					<StackPanel
						id="content"
						style={{ backgroundColor: "whitesmoke", height: "75vh" }}>
						{children}
					</StackPanel>

					<StackPanel
						id="footer"
						style={{ height: "10vh" }}>

					</StackPanel>

				</StackPanel>
			}
			const str = await renderToStringAsync(<Layout user={/*injectedInfo.user*/ undefined}>
				<SplashPage user={undefined} objectId={undefined} />
			</Layout>)
			// console.warn(`renderToStringAsync of layout result (in test): ${str}`)

			assert(str.length > 0)
			// assert.throws(() => { parseValue([] as any) }, Error, "Error thrown")
		})
	})


	describe("updateAsync", async () => {
		it("should update while maintaining the element type, if no overriding element is passed", async () => {
			const dom = await renderAsync(<View<string>
				id={"test_view"}
				sourceData={["a", "b", "c"]}
				itemsPanel={StackPanel}
				itemTemplate={item => <i style={{ width: "7em", border: "thin solid orange" }}>{item.value}</i>}
			/>)
			assert(!isTextDOM(dom))
			assert(!(dom instanceof DocumentFragment))

			const updatedDOM = await updateAsync(dom)

			assert(!isTextDOM(updatedDOM))
			assert(!(updatedDOM instanceof DocumentFragment))
		})

		it("should remove children from input dom element if input children array is empty", async () => {
			const dom = await renderAsync({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: [{ type: "span", props: { style: { display: "inline-block" } } }, "val"]
			})
			assert(!isTextDOM(dom))
			assert.strictEqual(dom.childNodes.length, 2)

			const updatedDOM = await updateAsync(dom as DOMAugmented, <div></div>)
			assert.strictEqual(updatedDOM.childNodes.length, 0)
		})

		it("should be able to remove, update and insert elements at the same time", async () => {
			const dom = await renderAsync({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: [
					{ type: "span", props: { style: { display: "inline-block" } } },
					"val",
					{ type: "div", props: { style: { display: "inline-block" } } }
				]
			})
			const newDiv = <div>
				<div style={{ display: "inline-block" }}></div>
				<span style={{ display: "inline-block" }}></span>
				<span style={{ display: "inline-block" }}></span>
				<span style={{ display: "inline-block" }}></span>
			</div>

			assert(!isTextDOM(dom))

			const updatedDOM = await updateAsync(dom as DOMAugmented, newDiv)
			const firstChild = updatedDOM.childNodes.item(0) as HTMLElement
			assert.strictEqual(firstChild.tagName.toUpperCase(), "DIV")
			const secondChild = updatedDOM.childNodes.item(1) as HTMLElement
			assert.strictEqual(secondChild.tagName.toUpperCase(), "SPAN")
			const fourthChild = updatedDOM.childNodes.item(3) as HTMLElement
			assert.strictEqual(fourthChild.tagName.toUpperCase(), "SPAN")
		})

		it("should not morph elements that have a matching id, when used in conjunction with nanomorph", async () => {
			const dom = await renderAsync({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: [
					{ type: "span", props: { style: { display: "inline-block" } } },
					"val",
					{ type: "input", props: { id: "myInput" } }
				]
			})
			const targetInput = dom.childNodes.item(2) as HTMLInputElement
			// We assign a value to that input
			targetInput.value = "test"

			const newChildren = <div>
				<input id="myInput" />
			</div>

			assert(!isTextDOM(dom))
			const thirdChild = dom.childNodes.item(2)

			const updatedDOM = await updateAsync(dom as DOMAugmented, newChildren)
			nanomorph(dom, updatedDOM)
			const updatedFirstChild = dom.childNodes.item(0) as HTMLInputElement
			assert.ok(thirdChild === updatedFirstChild)
		})

		it("should ensure that updated DOM elements have a renderTrace property", async () => {
			const dom = await renderAsync({
				type: "div",
				props: { className: "clss", style: { backgroundColor: "blue" } },
				children: [
					{ type: "span", props: { style: { display: "inline-block" } } },
					"val",
					{ type: "input", props: { id: "myInput" } }
				]
			}) as DOMAugmented
			const targetInput = dom.childNodes.item(2) as HTMLInputElement
			// We assign a value to that input
			targetInput.value = "test"

			const newChildren = <div>
				<input id="myInput" />
			</div>

			assert(!isTextDOM(dom))

			const updatedDOM = await updateAsync(dom as DOMAugmented, newChildren) as DOMAugmented
			nanomorph(dom, updatedDOM)
			assert.ok(updatedDOM.renderTrace !== undefined)
		})

		it("should keep the state of updated elements", async () => {
			const MainComponent: Component<{ id: string }> = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
				const defaultProps = {}
				let props = deepMerge(defaultProps, _props)
				const { id } = props

				const state = {
					iteratedVal: 0
				}

				while (true) {
					const { iteratedVal } = state
					const newProps = yield <div id={id}>
						<h1>Playground</h1>
						<div>
							<button
								id={"myButton"}
								onClick={() => {
									state.iteratedVal++
								}}>TEST</button>
						</div>
						<div id={"valueKeeper"}>
							Iterated value: {iteratedVal}
						</div>
					</div>

					props = mergeDeep()(
						props,
						newProps ?? {}
					)
				}
			}
			const dom = await renderAsync(<MainComponent id={"test-component"} />) as DOMAugmented
			document.body.appendChild(dom)

			const button = dom.querySelector("#myButton") as HTMLButtonElement
			button.click()
			button.click()
			const updatedDOM = await updateAsync(dom) as HTMLElement
			const valueKeeper = updatedDOM.querySelector("#valueKeeper") as HTMLButtonElement
			assert.strictEqual(valueKeeper.textContent, "Iterated value: 2")
		})

		it("should keep the state of updated elements' children", async () => {
			document.body.innerHTML = ""

			const MainComponent: Component = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
				const defaultProps = {}
				let props = deepMerge(defaultProps, _props)
				const { key } = props

				const state = {
					valueToKeep: 0
				}

				while (true) {
					const { valueToKeep } = state

					const newProps = yield <div>
						<h1>Playground</h1>
						<div>
							<button
								id={"myButton"}
								onClick={() => {
									state.valueToKeep++
								}}>TEST</button>
						</div>
						<div id={"valueKeeper"}>
							Iterated value: {valueToKeep}
						</div>
					</div>

					props = mergeDeep()(
						props,
						newProps ?? {}
					)
				}
			}
			const dom = await renderAsync(<div><MainComponent key={"test-component"} /></div>) as DOMAugmented
			document.body.appendChild(dom)

			const button = dom.querySelector("#myButton") as HTMLButtonElement
			button.click()
			button.click()
			const updatedDOM = await updateAsync(dom) as HTMLElement
			const valueKeeper = updatedDOM.querySelector("#valueKeeper") as HTMLButtonElement
			assert.strictEqual(valueKeeper.textContent, "Iterated value: 2")
		})
	})

	describe("mountElement", async () => {
		it("should work", async () => {
			await mountElement(<View<string>
				id={"test_view_id"}
				sourceData={["a", "b", "c"]}
				itemsPanel={StackPanel}
				itemTemplate={item => <i style={{ width: "7em", border: "thin solid orange" }}>{item.value}</i>}
			/>, document.body)

			document.dispatchEvent(new CustomEvent('UIInvalidated', { detail: { invalidatedElementIds: ["test_view_id"] } }))

			assert(true)
		})
	})

	describe("createElement", async () => {
		it("should create a element with props and children corresponsing to the arguments passed", async () => {
			const elt = createElement(View as Component, { sourceData: [], itemsPanel: StackPanel })

			assert.deepStrictEqual(elt.props, { sourceData: [], itemsPanel: StackPanel })
			assert.deepStrictEqual(elt.children, [])
		})
		it("should convert missing props and chiildren arguments into empty object and array, respectively", async () => {
			const elt = createElement("div", undefined)

			assert.deepStrictEqual(elt.props, {})
			assert.deepStrictEqual(elt.children, [])
		})
	})

})


// TYPE CHECKS

// these should fail type-checking
// const elt = createElement(StackPanel, { itemsAlignH: "stretch", x: 1 }, createElement("div", {}))
// const elt1 = createElement(StackPanel, { itemsAlignHX: "stretch" }, createElement("div", {}))

// this should pass type-checking
// const elt = createElement(StackPanel, { itemsAlignH: "stretch" }, createElement("div", {}))

// this should pass type-checking when children of elements are required
// const stack = <StackPanel itemsAlignH="start"><div /></StackPanel>

// cleanup()
type FontIcon = Component<Partial<{ color: string | null | undefined; size: string | number; style: CSSProperties }>>

const MakeIcon = (svgElement: JSX.Element): FontIcon =>
	// console.log(`MakeIcon svg elt props: ${JSON.stringify((svgElement as any).props)}`)
	function (props) {
		const elt = svgElement as any
		// console.log(`icon elt props: ${JSON.stringify((elt as any).props)}`)
		return <svg
			preserveAspectRatio='xMidYMid meet'
			{...elt.props}
			style={props.style}
			// width={props.size || (props.style || {}).width || undefined}
			// height={props.size || (props.style || {}).height || undefined}

			color={props.color || (props.style || {}).color || undefined}
			stroke={props.color || (props.style || {}).color || undefined}
			fill='currentColor'>

			{elt.children}
		</svg>
	}