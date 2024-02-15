import { deepMerge, mergeDeep, sleep } from "@sparkwave/standard"
import { default as cuid } from "cuid"
import { createElement, ComponentAsyncStateful, mountElement, invalidateUI, check } from "../dist/index"

document.addEventListener("DOMContentLoaded", async (_event) => {
    const rootDom = document.getElementById("sandbox-root")
    if (rootDom === null) throw new Error("Root DOM not found")

    mountElement(
        <MainComponent />,
        rootDom
    )
})

export const MainComponent: ComponentAsyncStateful = async function* (_props) {
    const defaultProps = { key: "mainComp" }
    let props = deepMerge(defaultProps, _props) as typeof _props
    const { key } = props
    check(key !== undefined)

    document.addEventListener('grandchildSendsValue', function (event: Event) {
        if (event instanceof CustomEvent) {
            state.parentValue = (event as GrandChildEvent).detail.value
            invalidateUI([key])
        }
    })

    document.addEventListener('deleteIndependantComponent', function (event: Event) {
        if (event instanceof CustomEvent) {
            const deletedKey = (event as DeleteIndependantEvent).detail.key
            state.independantStateComponents = state.independantStateComponents.filter(k => k !== deletedKey)
            invalidateUI([key])
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
                    invalidateUI([key])
                }}>INCREMENT VALUE</button>
                <button onClick={() => {
                    state.independantStateComponents.push(`independant-component-${cuid()}`)
                    invalidateUI([key])
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
                    invalidateUI([key])
                }} />
            {
                state.receivedMsgFromChild
                    ? <h3>{state.receivedMsgFromChild}</h3>
                    : <div />
            }
            {
                independantStateComponents.map(key =>
                    <IndependantChildComponent key={key}>
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
    const { key } = props
    check(key !== undefined)

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
                        invalidateUI([key])
                    }}></input>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.myStateValue = myStateValue + 1
                    invalidateUI([key])
                }}>
                    Increase state value
                </button>
            </p>
            <p>
                <button onClick={() => {
                    console.log(props)
                    state.myStateValue = myStateValue + 1
                    invalidateUI([key])
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

type DeleteIndependantEvent = CustomEvent<{ key: string }>
export const IndependantChildComponent: ComponentAsyncStateful = async function* (_props) {
    const { key } = _props
    if (key === undefined) throw new Error("key is undefined")

    const state = {
        myStateValue: 0
    }

    const dispatchDeleteEvent = (key: string) => {
        const event: DeleteIndependantEvent = new CustomEvent("deleteIndependantComponent", { detail: { key: key } })
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
                    invalidateUI([key])
                }}>
                    Increase state value
                </button>
            </p>
            <button onClick={() => {
                dispatchDeleteEvent(key)
            }}>Delete</button>
            <GrandChildComponent />
        </div>
    }
}

type GrandChildEvent = CustomEvent<{ value: number }>
export const GrandChildComponent: ComponentAsyncStateful = async function* (_props) {
    const { key } = _props
    check(key !== undefined)

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
        invalidateUI([key])
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
                    invalidateUI([key])
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