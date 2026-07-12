import { expect } from "@playwright/test"

import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Toggle markers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("wraps selected blocks as a toggle", async ({ page, editor }) => {
    await editor.setValue("<h2>Question</h2><p>Subtitle</p>")
    await editor.selectAll()

    await applyMarker(page, "toggle", "faq-1")

    await assertEditorHtml(editor, '<div data-lexxy-toggle="faq-1"><h2>Question</h2><p>Subtitle</p></div>')
  })

  test("wraps selected blocks as a toggle target", async ({ page, editor }) => {
    await editor.setValue("<p>First detail</p><p>Second detail</p>")
    await editor.selectAll()

    await applyMarker(page, "target", "faq-1")

    await assertEditorHtml(editor, '<div data-lexxy-toggle-target="faq-1"><p>First detail</p><p>Second detail</p></div>')
  })

  test("imports and exports multiple independent pairs", async ({ editor }) => {
    const html = [
      '<div data-lexxy-toggle="faq-1"><h2>First</h2></div>',
      '<div data-lexxy-toggle-target="faq-1"><p>First answer</p></div>',
      '<div data-lexxy-toggle="faq-2"><h2>Second</h2></div>',
      '<div data-lexxy-toggle-target="faq-2"><p>Second answer</p></div>'
    ].join("")

    await editor.setValue(html)

    await assertEditorHtml(editor, html)
  })

  test("edits the current marker ID and synchronizes the toolbar", async ({ page, editor }) => {
    await editor.setValue('<div data-lexxy-toggle="faq-1"><p>Question</p></div>')
    await editor.content.getByText("Question").click()

    const dropdown = markerDropdown(page, "toggle")
    await expect(dropdown.locator("[data-dropdown-trigger]")).toHaveAttribute("aria-pressed", "true")
    await dropdown.locator("[data-dropdown-trigger]").click()
    await expect(dropdown.locator("[data-toggle-marker-id]")).toHaveValue("faq-1")

    await dropdown.locator("[data-toggle-marker-id]").fill("faq-2")
    await dropdown.locator("[data-toggle-marker-apply]").click()

    await assertEditorHtml(editor, '<div data-lexxy-toggle="faq-2"><p>Question</p></div>')
  })

  test("converts an existing marker instead of nesting it", async ({ page, editor }) => {
    await editor.setValue('<div data-lexxy-toggle="faq-1"><p>Content</p></div>')
    await editor.content.getByText("Content").click()

    await applyMarker(page, "target", "faq-2")

    await assertEditorHtml(editor, '<div data-lexxy-toggle-target="faq-2"><p>Content</p></div>')
  })

  test("flattens selected markers before grouping them", async ({ page, editor }) => {
    await editor.setValue('<div data-lexxy-toggle="faq-1"><h2>Question</h2></div><p>More information</p>')
    await editor.selectAll()

    await applyMarker(page, "target", "faq-2")

    await assertEditorHtml(editor, '<div data-lexxy-toggle-target="faq-2"><h2>Question</h2><p>More information</p></div>')
  })

  test("clears the current marker without deleting its contents", async ({ page, editor }) => {
    await editor.setValue('<div data-lexxy-toggle-target="faq-1"><p>Content</p></div>')
    await editor.content.getByText("Content").click()

    const dropdown = markerDropdown(page, "target")
    await openMarkerDropdown(page, dropdown)
    await dropdown.locator("[data-toggle-marker-clear]").click()

    await assertEditorHtml(editor, "<p>Content</p>")
  })

  test("rejects an invalid pair ID", async ({ page, editor }) => {
    await editor.setValue("<p>Question</p>")
    await editor.select("Question")

    const dropdown = markerDropdown(page, "toggle")
    await dropdown.locator("[data-dropdown-trigger]").click()
    const input = dropdown.locator("[data-toggle-marker-id]")
    await input.fill("not a safe id")
    await dropdown.locator("[data-toggle-marker-apply]").click()

    await expect(input).toHaveJSProperty("validationMessage", "Use letters or numbers followed by letters, numbers, dots, underscores, colons, or hyphens.")
    await assertEditorHtml(editor, "<p>Question</p>")
  })

  test("unwraps nested markers on import", async ({ editor }) => {
    await editor.setValue('<div data-lexxy-toggle="outer"><div data-lexxy-toggle-target="inner"><p>Content</p></div></div>')

    await assertEditorHtml(editor, '<div data-lexxy-toggle="outer"><p>Content</p></div>')
  })

  test("supports undo and redo", async ({ page, editor }) => {
    await editor.focus()
    await editor.send("Question")
    await editor.select("Question")
    await applyMarker(page, "toggle", "faq-1")
    await assertEditorHtml(editor, '<div data-lexxy-toggle="faq-1"><p>Question</p></div>')

    await dispatchEditorCommand(editor, "undo")
    await assertEditorHtml(editor, "<p>Question</p>")

    await dispatchEditorCommand(editor, "redo")
    await assertEditorHtml(editor, '<div data-lexxy-toggle="faq-1"><p>Question</p></div>')
  })
})

async function applyMarker(page, role, id) {
  const dropdown = markerDropdown(page, role)
  await openMarkerDropdown(page, dropdown)
  await dropdown.locator("[data-toggle-marker-id]").fill(id)
  await dropdown.locator("[data-toggle-marker-apply]").click()
}

async function openMarkerDropdown(page, dropdown) {
  const isOverflowed = await dropdown.evaluate((element) => Boolean(element.closest(".lexxy-editor__toolbar-overflow-menu")))
  if (isOverflowed) {
    await page.getByLabel("Show more toolbar buttons").click()
  }
  await dropdown.locator("[data-dropdown-trigger]").click()
}

function markerDropdown(page, role) {
  return page.locator(`lexxy-toggle-marker-dropdown[data-marker-role="${role}"]`)
}

async function dispatchEditorCommand(editor, command) {
  await editor.locator.evaluate((element, dispatchedCommand) => {
    element.editor.dispatchCommand(dispatchedCommand)
  }, command)
}
