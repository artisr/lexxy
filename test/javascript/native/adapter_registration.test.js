import { afterEach, describe, expect, test } from "vitest"
import { captureEvent, createTestEditor, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"
import { BrowserAdapter } from "../../../src/editor/adapters/browser_adapter"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("adapter registration", () => {
  test("editor uses BrowserAdapter by default", async () => {
    editorElement = await createTestEditor()

    expect(editorElement.adapter).toBeInstanceOf(BrowserAdapter)
  })

  test("default BrowserAdapter dispatches initialized event", async () => {
    editorElement = await createTestEditor()

    const event = await captureEvent(editorElement, "lexxy:editor-initialized", () => {
      editorElement.dispatchEditorInitialized()
    })

    expect(event.detail).toHaveProperty("highlightColors")
    expect(event.detail).toHaveProperty("headingFormats")
  })

  test("default BrowserAdapter dispatches attributes event with link classes", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a></p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(true)
    expect(event.detail.link).toEqual({ href: "/start", className: "custom-button hero" })
  })

  test("registerAdapter replaces the default adapter", async () => {
    editorElement = await createTestEditor()

    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized() {},
      dispatchAttributesChange() {},
      freeze() {},
      thaw() {}
    }

    editorElement.registerAdapter(customAdapter)

    expect(editorElement.adapter).toBe(customAdapter)
  })

  test("registerAdapter immediately syncs initialized and attributes state", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const initializedPayloads = []
    const attributesPayloads = []
    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedPayloads.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attributesPayloads.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    editorElement.registerAdapter(customAdapter)

    expect(initializedPayloads).toHaveLength(1)
    expect(initializedPayloads[0]).toHaveProperty("highlightColors")
    expect(initializedPayloads[0]).toHaveProperty("headingFormats")
    expect(attributesPayloads).toHaveLength(1)
    expect(attributesPayloads[0].attributes).toBeTruthy()
    expect(attributesPayloads[0]).toHaveProperty("headingTag")
  })

  test("dispatchEditorInitialized is safe after disconnect", async () => {
    editorElement = await createTestEditor()
    await destroyTestEditor(editorElement)

    expect(() => editorElement.dispatchEditorInitialized()).not.toThrow()
  })

  test("registerAdapter does not double-dispatch initialized before first frame", async () => {
    editorElement = await createTestEditor({ skipTick: true })

    const initializedPayloads = []
    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedPayloads.push(detail)
      },
      dispatchAttributesChange() {},
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    editorElement.registerAdapter(customAdapter)
    await tick()

    expect(initializedPayloads).toHaveLength(1)
  })

  test("dispatches lexxy:initialize when adapter is registered before first frame", async () => {
    editorElement = await createTestEditor({ skipTick: true })

    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized() {},
      dispatchAttributesChange() {},
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    let initializeFired = 0
    editorElement.addEventListener("lexxy:initialize", () => initializeFired++)

    editorElement.registerAdapter(customAdapter)
    await tick()

    expect(initializeFired).toBe(1)
  })
})
