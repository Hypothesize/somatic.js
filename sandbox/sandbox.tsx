import { deepMerge, mergeDeep } from "@sparkwave/standard"
import { createElement, Component, mountElement, invalidateUI } from "../dist/index"

document.addEventListener("DOMContentLoaded", async (_event) => {
    const rootDom = document.getElementById("sandbox-root")
    if (rootDom === null) throw new Error("Root DOM not found")

    mountElement(
        <MainComponent />,
        rootDom
    )
})

export const MainComponent: Component = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
    const componentId = "main-component"
    const defaultProps = {}
    let props = deepMerge(defaultProps, _props)

    const state = {
        iteratedVal: 0
    }

    while (true) {
        const { iteratedVal } = state
        const newProps = yield <div id={componentId}>
            <h1>Playground</h1>
            <div>
                <button onClick={() => {
                    state.iteratedVal++
                    invalidateUI([componentId])
                }}>TEST</button>
            </div>
            <div>
                Iterated value: {iteratedVal}
            </div>
            <div>
                <h3>Child component</h3>
                <ChildComponent iteratedVal={iteratedVal} />
            </div>
        </div>

        props = mergeDeep()(
            props,
            newProps ?? {}
        )
    }
}
export const ChildComponent: Component<{ iteratedVal: number }> = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
    const componentId = "child-component";

    (window as any).invocationId = (window as any).invocationId !== undefined ? (window as any).invocationId + 1 : 0
    const invocationId = (window as any).invocationId

    console.log(`invocationId: ${(window as any).invocationId}`)

    console.log(`props received from the parent on initial render: ${JSON.stringify(_props)}`)
    const defaultProps = {
        iteratedVal: 0
    }
    const state = {
        stateIteratedNumber: _props.iteratedVal as number,
        inputValue: ""
    }

    while (true) {
        let props = deepMerge(defaultProps, _props)
        const { iteratedVal } = props
        const { stateIteratedNumber, inputValue } = state

        console.log(`props at re-render time: ${JSON.stringify(props)}`)

        // const newProps = yield <div id={componentId}>
        yield <div id={componentId}>
            <div>
                <p>Iterated value received from props: {iteratedVal}</p>
                <p>Iterated value from state: {stateIteratedNumber}</p>
            </div>
            <button onClick={() => {
                invalidateUI([componentId])
            }}>
                Click me to re-render myself
            </button>
            <input id="myInput"
                value={inputValue}
                type={"text"}
                onInput={ev => {
                    state.inputValue = ev.currentTarget.value
                    state.stateIteratedNumber = (stateIteratedNumber as number) + 1
                    invalidateUI([componentId])
                }}></input>
            <button onClick={() => {
                console.log(props)
                state.stateIteratedNumber = (stateIteratedNumber as number) + 1
                invalidateUI([componentId])
            }}>
                Click me to re-render myself
            </button>
            <button onClick={() => {
                console.log(props)
                state.stateIteratedNumber = (stateIteratedNumber as number) + 1
                invalidateUI([componentId])
            }}>
                Click me to re-render myself
            </button>
        </div>

        // globalProps[componentId] = mergeDeep()(
        //     globalProps[componentId],
        //     newProps ?? {}
        // )
    }
}