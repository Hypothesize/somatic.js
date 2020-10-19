/* eslint-disable brace-style */

import { createElement, updateDOM, removeAllListeners, render, renderToString, hydrate } from './core'
import { makeFileInput } from './components'


const internalPropsCache = {
	storage: {} as Record<string, any>,
	get: function (key: string) { return this.storage[key] },
	set: function (key: string, payload: any) {
		// eslint-disable-next-line fp/no-mutation
		this.storage[key] = {
			...this.storage[key],
			payload
		}
	},
}
const FileInput = makeFileInput({ internalPropsCache })

async function renderAsync() {
	removeAllListeners(document)

	const app = await render(<div>
		<FileInput
			icon={() => <span></span>}
			labelStyle={{}}
			loadAs="array"
			style={{ height: "auto", width: "auto", fontSize: "14px" }}
			postMsgAsync={async (msg) => {
				console.log('Message received' + msg.type)
			}}>
		</FileInput>
	</div>)

	updateDOM(document.getElementById("root-div")!, app)
}

document.addEventListener("DOMContentLoaded", async (event) => {
	await renderAsync()
})