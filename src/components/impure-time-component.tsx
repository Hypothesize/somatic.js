/* eslint-disable fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, makeFunctionComponent } from '../core'

export const ImpureTimeComponent = makeFunctionComponent(() => {
	return <div style={{ border: " solid 1px gray", padding: "1em" }}>
		<span>Current time: {new Date()}</span>
	</div>
}, {
	isPure: false
})