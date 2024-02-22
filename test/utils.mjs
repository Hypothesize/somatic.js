//@ts-check

//#region Testing utilities

/** Create html element from html string; Requires <document> object to exist
 * @param {string} html 
 * @returns {HTMLElement}
 */
export function constructElement(html) {
	const div = document.createElement("div")
	div.innerHTML = html.trim()
	return div
}

// export function excludeAttributes(target: string, attributes: string[]): string
// export function excludeAttributes(target: HTMLElement, attributes: string[]): HTMLElement

/** Remove some attributes from an html element string 
 * @param {HTMLElement | string} target 
 * @param {string[]} attributes 
 * @returns {string | HTMLElement}
 */
export function excludeAttributes(target, attributes) {
	const div = constructElement(typeof target === "string" ? target : target.innerHTML)
	attributes.forEach(a => div.removeAttribute(a))
	return typeof target === "string" ? div.innerHTML : div
}

/** @param {string} html  */
export function normalizeHTML(html) {
	return html //excludeAttributes(html, ["id"])
		.replace(/( \w*="undefined")/, "") // remove atributes set to the string "undefined"
		.replace(/ class="(\w*)"/, ' className="$1"')
		.replace(/ for="(\w*)"/, ' htmlFor="$1"')
}

//#endregion