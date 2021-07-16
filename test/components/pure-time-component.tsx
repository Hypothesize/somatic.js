/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeComponent } from '../../src/core'

export const PureTimeComponent = makeComponent(function () {
	return <div style={{ border: " solid 1px gray", padding: "1em" }}>
		<span>Current time: {new Date()}</span>
	</div>
}, {
	stateful: false
})