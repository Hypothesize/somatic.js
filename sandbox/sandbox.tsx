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
        parentValue: 0
    }

    while (true) {
        const { parentValue } = state
        const newProps = yield <div
            id={componentId}
            style={{ border: "solid 1px gray" }}
        >
            <h3>Parent component</h3>
            <div>
                <button onClick={() => {
                    state.parentValue++
                    invalidateUI([componentId])
                }}>TEST</button>
            </div>
            <div>
                Parent component value (passed as props to Child component): {parentValue}
            </div>
            <ChildComponent parentValue={parentValue} />
            <IndependantChildComponent
                id={"independant-child-component"}
                onMessageForParent={() => {
                    console.log(`Message received from independant child component. Parent value: ${state.parentValue}`)
                }}
            />
        </div>

        props = mergeDeep()(
            props,
            newProps ?? {}
        )
    }
}
export const ChildComponent: Component<{ parentValue: number }> = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
    const componentId = "child-component"

    // (window as any).invocationId = (window as any).invocationId !== undefined ? (window as any).invocationId + 1 : 0
    // const invocationId = (window as any).invocationId

    // console.log(`invocationId: ${(window as any).invocationId}`)

    console.log(`props received from the parent on initial render: ${JSON.stringify(_props)}`)
    const defaultProps = {
        parentValue: 0
    }
    let props = deepMerge(defaultProps, _props)

    const state = {
        childValue: props.parentValue as number,
        inputValue: ""
    }

    while (true) {
        const { parentValue } = props
        const { childValue, inputValue } = state

        console.log(`props at re-render time: ${JSON.stringify(props)}`)

        // const newProps = yield <div id={componentId}>
        const newProps = yield <div
            id={componentId}
            style={{ background: "#ddd", margin: "1rem" }}>
            <div>
                <h3>Child component (props derived from the parent's state)</h3>
                <p>Props value received from parent: {parentValue}</p>
                <p>State value of child component: {childValue}</p>
            </div>
            <button onClick={() => {
                invalidateUI([componentId])
            }}>
                Re-render child component
            </button>
            <p>
                <input id="myInput"
                    value={inputValue}
                    style={{ width: "400px" }}
                    placeholder={"Typing will increase child state value, re-render, and keep focus"}
                    type={"text"}
                    onInput={ev => {
                        state.inputValue = ev.currentTarget.value
                        state.childValue = childValue + 1
                        invalidateUI([componentId])
                    }}></input>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.childValue = childValue + 1
                    invalidateUI([componentId])
                }}>
                    Increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.childValue = childValue + 1
                    invalidateUI([componentId])
                }}>

                    Also increase state value
                </button>
            </p>
        </div>

        props = mergeDeep()(
            props,
            newProps ?? {}
        )
    }
}

export const IndependantChildComponent: Component<{ id: string, onMessageForParent: () => void }> = async function* (_props): AsyncGenerator<JSX.Element, JSX.Element, typeof _props> {
    const { onMessageForParent, id } = _props

    const state = {
        childValue: 0
    }

    while (true) {
        const { childValue } = state

        yield <div
            id={id}
            style={{ background: "#ddd", margin: "1rem" }}>
            <div>
                <h3>Independant child component (doesn't receive any props from the parent)</h3>
                <p>State value of independant component: {childValue}</p>
            </div>
            <p>
                <button onClick={() => {
                    state.childValue = childValue + 1
                    invalidateUI([id])
                }}>
                    Increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    onMessageForParent()
                }}>
                    Message for parent
                </button>
            </p>
        </div>
    }
}