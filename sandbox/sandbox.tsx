import { default as assert } from "assert"
import { default as cuid } from "cuid"
import { deepMerge, mergeDeep, sleep } from "@sparkwave/standard"
import { createElement, ComponentAsyncStateful, Component, mountElement, invalidateUI } from "../dist/index"

document.addEventListener("DOMContentLoaded", async (_event) => {
    const rootDom = document.getElementById("sandbox-root")
    if (rootDom === null) throw new Error("Root DOM not found")

    mountElement(
        <MainComponent />,
        rootDom
    )
})

export const MainComponent: ComponentAsyncStateful = async function* (_props) {
    const defaultProps = {}
    let props = deepMerge(defaultProps, _props) as typeof _props
    const { uniqueKey } = props
    assert(uniqueKey !== undefined)

    document.addEventListener('grandchildSendsValue', function (event: Event) {
        if (event instanceof CustomEvent) {
            state.parentValue = (event as GrandChildEvent).detail.value
            invalidateUI([uniqueKey])
        }
    })

    document.addEventListener('deleteIndependantComponent', function (event: Event) {
        if (event instanceof CustomEvent) {
            const deletedName = (event as DeleteIndependantEvent).detail.name
            state.independantStateComponents = state.independantStateComponents.filter(k => k !== deletedName)
            invalidateUI([uniqueKey])
        }
    })

    const state = {
        parentValue: 0,
        independantStateComponents: [] as string[],
        receivedMsgFromChild: undefined as string | undefined
    }

    while (true) {
        const { parentValue, independantStateComponents } = state
        const newProps = yield <div
            style={{ border: "thin solid gray", padding: "0.5rem" }}
        >
            <h3>Parent component</h3>
            <div>
                <button onClick={() => {
                    state.parentValue++
                    invalidateUI([uniqueKey])
                }}>INCREMENT VALUE</button>
                <button onClick={() => {
                    state.independantStateComponents.push(`indep-comp-${cuid()}`)
                    invalidateUI([uniqueKey])
                }}>
                    Add independant child component
                </button>
            </div>
            <p>
                Value (passed as props to Child component): {parentValue}
            </p>
            <ChildComponent
                parentValue={parentValue}
                onMessageForParent={(childStateVal) => {
                    state.receivedMsgFromChild = `Received message 'myStateVal: ${childStateVal}' from child component`
                    invalidateUI([uniqueKey])
                }} />
            {
                state.receivedMsgFromChild
                    ? <h3>{state.receivedMsgFromChild}</h3>
                    : <div />
            }
            {
                independantStateComponents.map(componentName =>
                    <IndependantChildComponent key={componentName} name={componentName}>
                        Test
                    </IndependantChildComponent>
                )
            }

        </div>

        props = mergeDeep()(
            props,
            newProps ?? {}
        )
    }
}
export const ChildComponent: ComponentAsyncStateful<{ parentValue: number, onMessageForParent: (myStateValue: number) => void }> = async function* (_props) {
    // (window as any).invocationId = (window as any).invocationId !== undefined ? (window as any).invocationId + 1 : 0
    // const invocationId = (window as any).invocationId

    // console.log(`invocationId: ${(window as any).invocationId}`)
    // console.log(`props received from the parent on initial render: ${JSON.stringify(_props)}`)
    const defaultProps = {
        parentValue: 0
    }
    let props = deepMerge(defaultProps, _props)
    const { uniqueKey } = props
    assert(uniqueKey !== undefined)

    const state = {
        myStateValue: props.parentValue as number,
        inputValue: ""
    }

    while (true) {
        const { parentValue, onMessageForParent } = props
        const { myStateValue, inputValue } = state

        const newProps = yield <div
            style={{ background: "#ddd", padding: "0.5rem" }}>
            <div>
                <h3>Child component</h3>
                <p>Props value received from parent: {parentValue}</p>
                <p>State value of child component: {myStateValue}</p>
            </div>
            <p>
                <input
                    value={inputValue}
                    style={{ width: "400px" }}
                    placeholder={"Typing will increase child state value, re-render, and keep focus"}
                    type={"text"}
                    onInput={ev => {
                        state.inputValue = ev.currentTarget.value
                        state.myStateValue = myStateValue + 1
                        invalidateUI([uniqueKey])
                    }}></input>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.myStateValue = myStateValue + 1
                    invalidateUI([uniqueKey])
                }}>
                    Increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.myStateValue = myStateValue + 1
                    invalidateUI([uniqueKey])
                }}>

                    Also increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    onMessageForParent(state.myStateValue)
                }}>
                    Message parent
                </button>
            </p>
        </div>

        props = mergeDeep()(
            props,
            newProps ?? {}
        )
    }
}

type DeleteIndependantEvent = CustomEvent<{ name: string }>
export const IndependantChildComponent: ComponentAsyncStateful<{ name: string }> = async function* (_props) {
    const { uniqueKey, name } = _props
    if (uniqueKey === undefined) throw new Error("key is undefined")

    const state = {
        myStateValue: 0
    }

    const dispatchDeleteEvent = (name: string) => {
        const event: DeleteIndependantEvent = new CustomEvent("deleteIndependantComponent", { detail: { name: name } })
        document.dispatchEvent(event)
    }

    while (true) {
        const { myStateValue } = state

        yield <div
            style={{ background: "#ddd", margin: "1rem" }}>
            <div>
                <h3>Independant child component (no props, uses event)</h3>
                <p>State value of independant component: {myStateValue}</p>
            </div>
            <p>
                <button onClick={() => {
                    state.myStateValue++
                    invalidateUI([uniqueKey])
                }}>
                    Increase state value
                </button>
            </p>
            <button onClick={() => {
                dispatchDeleteEvent(name)
            }}>Delete</button>
            <GrandChildComponent />
            <ExplicitelyKeyedComponent key={"key 1"} />
            <ExplicitelyKeyedComponent key={"key 2"} />
            <ExplicitelyKeyedComponent key={"key 3"} />
        </div>
    }
}

type GrandChildEvent = CustomEvent<{ value: number }>
export const GrandChildComponent: ComponentAsyncStateful = async function* (_props) {
    const { uniqueKey } = _props
    assert(uniqueKey !== undefined)

    const state = {
        myStateValue: 0
    }

    const dispatchValueTransferEvent = () => {
        const event: GrandChildEvent = new CustomEvent("grandchildSendsValue", { detail: { value: state.myStateValue } })
        document.dispatchEvent(event)
    }

    // This tests the problem of updates to elements that have yet to exist in the DOM
    const immediateUpdate = () => {
        state.myStateValue = 3
        invalidateUI([uniqueKey])
    }
    immediateUpdate()

    while (true) {
        const { myStateValue } = state

        // To see if the immediate causes problems or not
        sleep(1000)

        yield <div
            style={{ background: "#ddd", margin: "1rem" }}>
            <div>
                <h3>Grandchild component (dispatch events to document)</h3>
                <p>State value: {myStateValue}</p>
            </div>
            <p>
                <button onClick={() => {
                    state.myStateValue = myStateValue + 1
                    invalidateUI([uniqueKey])
                }}>
                    Increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    dispatchValueTransferEvent()
                }}>
                    Dispatch event with state value
                </button>
            </p>
        </div>
    }
}

/** This is just named like that because it WILL receive an explicit key */
export const ExplicitelyKeyedComponent: Component = function (_props) {
    const { uniqueKey, key } = _props
    assert(uniqueKey !== undefined)

    while (true) {

        return <div
            style={{ border: "1px solid #333", margin: "1rem", padding: "1rem" }}>
            <div>
                <h3>Explicitely keyed component (a simple key was passed, and it should be unique through combination with the parent's key)</h3>
                <p style={{ color: "#999" }}>Custom key: {key}</p>
                <p style={{ color: "#c99" }}>Unique key: {uniqueKey}</p>
            </div>
        </div>
    }
}