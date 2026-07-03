import { afterEach, describe, expect, test } from "vitest"
import { $getRoot } from "lexical"
import { createTestEditorWithNativeAdapter, destroyTestEditor, setContent, selectAll, captureEvent, dispatchToolbarCommand, tick } from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("attributes change event", () => {
  test("dispatches event with all expected attribute keys", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    const expectedKeys = [
      "bold", "italic", "strikethrough", "code", "highlight",
      "link", "quote", "heading", "unordered-list", "ordered-list",
      "undo", "redo"
    ]

    expect(Object.keys(event.detail.attributes).sort()).toEqual(expectedKeys.sort())
  })

  test("each attribute has active and enabled properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    for (const [key, value] of Object.entries(event.detail.attributes)) {
      expect(value).toHaveProperty("active")
      expect(value).toHaveProperty("enabled")
      expect(typeof value.active).toBe("boolean")
      expect(typeof value.enabled).toBe("boolean")
    }
  })

  test("reports formatting attributes as inactive for plain text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.bold).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.italic).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.strikethrough).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.code).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.link).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.quote).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.heading).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes["unordered-list"]).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes["ordered-list"]).toEqual({ active: false, enabled: true })
  })

  test("reports link as active with href when cursor is inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>linked text</a></p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(true)
    expect(event.detail.link).toEqual({ href: "https://example.com" })
  })

  test("reports link class names when cursor is inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a></p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(true)
    expect(event.detail.link).toEqual({ href: "/start", className: "custom-button hero" })
  })

  test("link class names survive HTML import and export", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a></p>')

    expect(editorElement.value).toContain('href="/start"')
    expect(editorElement.value).toContain('class="custom-button hero"')
  })

  test("reports font size for the current selection", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><span style="font-size: 18px;">hello world</span></p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.fontSize).toBe("18px")
  })

  test("does not report font size for mixed styled and plain selected text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><span style="font-size: 18px;">Large</span> plain</p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.fontSize).toBeNull()
  })

  test("does not report stale font size after moving the caret into plain text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><span style="font-size: 18px;">Large</span> plain</p>')
    selectText(editorElement, "Large", { anchorOffset: 2, focusOffset: 2 })

    await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    selectText(editorElement, "plain", { anchorOffset: 2, focusOffset: 2 })
    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.fontSize).toBeNull()
  })

  test("reports imported font and background color styles for the current selection", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><mark style="color: rgb(18, 58, 188); background-color: rgb(252, 220, 90);">hello world</mark></p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.highlight.active).toBe(true)
    expect(event.detail.highlight).toEqual({
      color: "rgb(18, 58, 188)",
      backgroundColor: "rgb(252, 220, 90)"
    })
  })

  test("does not report highlight styles for mixed highlighted and plain selected text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><mark style="color: rgb(18, 58, 188);">Styled</mark> plain</p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.highlight.active).toBe(false)
    expect(event.detail.highlight).toBeNull()
  })

  test("reports custom button link details after imported HTML is selected with a collapsed caret", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a> plain</p>')
    selectText(editorElement, "Start", { anchorOffset: 2, focusOffset: 2 })

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(true)
    expect(event.detail.link).toEqual({ href: "/start", className: "custom-button hero" })
  })

  test("does not keep custom button link details after moving the caret into plain text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a> plain</p>')
    selectText(editorElement, "Start", { anchorOffset: 2, focusOffset: 2 })

    await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    selectText(editorElement, "plain", { anchorOffset: 2, focusOffset: 2 })
    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(false)
    expect(event.detail.link).toBeNull()
  })

  test("does not report custom button link details for mixed link and plain selected text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><a href="/start" class="custom-button hero">Start</a> plain</p>')
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(false)
    expect(event.detail.link).toBeNull()
  })

  test("returns null link when not inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>plain text</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.link).toBeNull()
    expect(event.detail.headingTag).toBeNull()
  })

  test("reports quote as active when inside a blockquote", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<blockquote>quoted text</blockquote>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.quote.active).toBe(true)
  })

  test("reports heading as active when inside a heading", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<h2>heading text</h2>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.heading.active).toBe(true)
    expect(event.detail.headingTag).toBe("h2")
  })

  test("includes undo/redo state", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.undo).toEqual({ active: false, enabled: expect.any(Boolean) })
    expect(event.detail.attributes.redo).toEqual({ active: false, enabled: expect.any(Boolean) })
  })

  test("preserves text formatting when parsing HTML", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    // Bold
    await setContent(editorElement, "<p><strong>bold</strong></p>")
    let format = readFirstTextNodeFormat(editorElement)
    expect(format & 1).toBe(1) // bold bit

    // Italic
    await setContent(editorElement, "<p><em>italic</em></p>")
    format = readFirstTextNodeFormat(editorElement)
    expect(format & 2).toBe(2) // italic bit

    // Strikethrough
    await setContent(editorElement, "<p><s>struck</s></p>")
    format = readFirstTextNodeFormat(editorElement)
    expect(format & 4).toBe(4) // strikethrough bit
  })

  test("font size survives export and can be cleared", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    dispatchToolbarCommand(editorElement, "setFontSize", "20px")
    await tick()
    expect(editorElement.value).toContain("font-size: 20px")

    dispatchToolbarCommand(editorElement, "setFontSize", null)
    await tick()
    expect(editorElement.value).not.toContain("font-size")
  })

  test("sanitization keeps supported styles and strips unsupported style properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, '<p><span style="font-size: 14px; color: red; background-color: yellow; font-weight: 700;">Styled</span></p>')

    expect(editorElement.value).toContain("font-size: 14px")
    expect(editorElement.value).toContain("color: red")
    expect(editorElement.value).toContain("background-color: yellow")
    expect(editorElement.value).not.toContain("font-weight")
  })

  test("link command can create and clear link class names", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>Start</p>")
    selectAll(editorElement)

    dispatchToolbarCommand(editorElement, "link", { url: "/start", className: "custom-button hero" })
    await tick()
    expect(editorElement.value).toContain('href="/start"')
    expect(editorElement.value).toContain('class="custom-button hero"')

    selectAll(editorElement)
    dispatchToolbarCommand(editorElement, "link", "/plain")
    await tick()
    expect(editorElement.value).toContain('href="/plain"')
    expect(editorElement.value).not.toContain("custom-button")
  })
})

function readFirstTextNodeFormat(editorElement) {
  let format = 0
  editorElement.editor.getEditorState().read(() => {
    format = $getRoot().getFirstDescendant().getFormat()
  })
  return format
}

function selectText(editorElement, text, { anchorOffset = 0, focusOffset = text.length } = {}) {
  editorElement.editor.update(() => {
    const textNode = $getRoot().getAllTextNodes().find(node => node.getTextContent().includes(text))
    if (!textNode) throw new Error(`Could not find text node containing "${text}"`)

    const start = textNode.getTextContent().indexOf(text)
    const selection = textNode.select(start + anchorOffset, start + anchorOffset)
    selection.focus.set(textNode.getKey(), start + focusOffset, "text")
  }, { discrete: true })
}
