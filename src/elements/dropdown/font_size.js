import { ToolbarDropdown } from "../toolbar_dropdown"
import { getSelectionStyle } from "../../helpers/format_helper"
import { registerEventListener } from "../../helpers/listener_helper"

const FONT_SIZE_PATTERN = /^(?:\d+(?:\.\d+)?(?:px|rem|em|%)|\d+(?:\.\d+)?)$/i
const BARE_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/

export class FontSizeDropdown extends ToolbarDropdown {
  editorReady() {
    this.track(
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.applyButton, "click", this.#handleApply),
      registerEventListener(this.clearButton, "click", this.#handleClear)
    )
  }

  onClose() {
    this.input.setCustomValidity("")
  }

  syncSelection(selection) {
    const fontSize = getSelectionStyle(selection, "font-size")
    this.trigger.setAttribute("aria-pressed", (!!fontSize).toString())

    if (this.isClosed) {
      this.input.value = fontSize || ""
      this.input.setCustomValidity("")
    }
  }

  get input() {
    return this.panel.querySelector("[data-font-size-input]")
  }

  get applyButton() {
    return this.panel.querySelector("[data-font-size-apply]")
  }

  get clearButton() {
    return this.panel.querySelector("[data-font-size-clear]")
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.#handleApply()
    }
  }

  #handleApply = () => {
    const fontSize = normalizeFontSize(this.input.value)
    if (fontSize === undefined) {
      this.input.setCustomValidity("Use a size like 14px, 1.1rem, 1em, or 120%.")
      this.input.reportValidity()
      return
    }

    this.input.setCustomValidity("")
    this.input.value = fontSize || ""
    this.editor.dispatchCommand("setFontSize", fontSize)
    this.close()
  }

  #handleClear = () => {
    this.input.value = ""
    this.input.setCustomValidity("")
    this.editor.dispatchCommand("setFontSize", null)
    this.close()
  }
}

function normalizeFontSize(value) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!FONT_SIZE_PATTERN.test(trimmed)) return undefined

  return BARE_NUMBER_PATTERN.test(trimmed) ? `${trimmed}px` : trimmed
}

export default FontSizeDropdown
