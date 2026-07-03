import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

const HEADING_FORMATS = [
  { command: "setFormatHeading1", tag: "h1", label: "Heading 1" },
  { command: "setFormatHeading2", tag: "h2", label: "Heading 2" },
  { command: "setFormatHeading3", tag: "h3", label: "Heading 3" },
  { command: "setFormatHeading4", tag: "h4", label: "Heading 4" },
  { command: "setFormatHeading5", tag: "h5", label: "Heading 5" },
  { command: "setFormatHeading6", tag: "h6", label: "Heading 6" },
]

test.describe("Heading format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  HEADING_FORMATS.forEach(({ command, tag, label }) => {
    test(`${label} does not nest paragraph inside heading`, async ({ page, editor }) => {
      await editor.setValue("<p>Lexxy</p>")
      await editor.select("Lexxy")

      await clickToolbarButton(page, command)
      await assertEditorHtml(editor, `<${tag}>Lexxy</${tag}>`)
    })
  })

  test("paragraph button removes heading", async ({ page, editor }) => {
    await editor.setValue("<h2>Lexxy</h2>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<p>Lexxy</p>")
  })

  test("paragraph button on heading inside blockquote preserves blockquote", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "setFormatHeading2")
    await editor.select("Lexxy")
    await clickToolbarButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    await editor.select("Lexxy")
    await clickToolbarButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<blockquote><p>Lexxy</p></blockquote>")
  })

  test("heading inside blockquote shows heading button as active, not paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "setFormatHeading2")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.select("Lexxy")
    await clickToolbarButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    // Click into the heading to place cursor and trigger button state update
    await editor.content.locator("h2").click()

    const heading = page.locator("[name='heading-2']")
    const paragraph = page.locator("[name='paragraph']")

    await expect(heading).toHaveAttribute("aria-pressed", "true")
    await expect(paragraph).toHaveAttribute("aria-pressed", "false")
  })

  test("legacy heading commands still apply their original heading levels", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await dispatchEditorCommand(editor, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.select("Lexxy")
    await dispatchEditorCommand(editor, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h3>Lexxy</h3>")

    await editor.select("Lexxy")
    await dispatchEditorCommand(editor, "setFormatHeadingSmall")
    await assertEditorHtml(editor, "<h4>Lexxy</h4>")
  })
})

async function dispatchEditorCommand(editor, command) {
  await editor.locator.evaluate((el, dispatchedCommand) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        el.editor.dispatchCommand(dispatchedCommand)
      }, { onUpdate: resolve })
    })
  }, command)
}
