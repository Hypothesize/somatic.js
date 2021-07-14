/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent } from '../core'

export const ImpureTimeComponent = makeComponent(() => {
	return <div style={{ border: " solid 1px gray", padding: "1em" }}>
		<span>Current time: {new Date()}</span>
	</div>
}, {
	stateful: false,
	isPure: false
})