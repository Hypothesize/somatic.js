/* eslint-disable @typescript-eslint/no-unused-vars */
import { createElement, mergeProps, makeComponent } from '../core'
import { Component, HtmlProps, PropsExtended } from '../types'
import { idProvider } from '../utils'


type Props = HtmlProps & {
	/** If enabled will trigger a modal closure event in case the escape keyboard is pressed*/
	closeOnEscape?: boolean,
}

const defaultProps = {
	closeOnEscape: true,
}

type Messages = { type: "CLOSURE" }

export const ModalBox = makeComponent<PropsExtended<Props>>(async function* (props) {
	const { postMsgAsync, style, children, closeOnEscape, ...htmlProps } = mergeProps(defaultProps, props)
	const id = idProvider.next()

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.keyCode === 27) {
			if (postMsgAsync)
				postMsgAsync({ type: "CLOSURE" })
		}
	}

	if (closeOnEscape === true) {
		window.addEventListener('keyup', handleKeyUp, false)
	}

	yield <div /* backdrop */
		id={id}
		style={{
			position: 'fixed',
			top: 0, bottom: 0, left: 0, right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			zIndex: 10
		}}>

		<div style={{ ...style, ...htmlProps }}>{children}</div>

	</div>

})