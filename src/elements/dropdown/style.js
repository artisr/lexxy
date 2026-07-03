import { ToolbarDropdown } from "../toolbar_dropdown"
import { getSelectionStyle } from "../../helpers/format_helper"
import { registerEventListener } from "../../helpers/listener_helper"

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB_COLOR_PATTERN = /^rgb\((.+)\)$/i

export class StyleDropdown extends ToolbarDropdown {
  editorReady() {
    this.track(
      registerEventListener(this.colorPicker, "input", this.#handleColorPickerInput),
      registerEventListener(this.input, "input", this.#handleTextInput),
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.applyButton, "click", this.#handleApply),
      registerEventListener(this.clearButton, "click", this.#handleClear)
    )
  }

  onClose() {
    this.input.setCustomValidity("")
  }

  syncSelection(selection) {
    const value = getSelectionStyle(selection, this.property)
    this.trigger.setAttribute("aria-pressed", (!!value).toString())
    this.#syncInputs(value)
  }

  get property() {
    return this.dataset.styleControl
  }

  get defaultColor() {
    return this.dataset.styleDefault || "#000000"
  }

  get colorPicker() {
    return this.panel.querySelector("[data-style-color-picker]")
  }

  get input() {
    return this.panel.querySelector("[data-style-value]")
  }

  get applyButton() {
    return this.panel.querySelector("[data-style-apply]")
  }

  get clearButton() {
    return this.panel.querySelector("[data-style-clear]")
  }

  #handleColorPickerInput = () => {
    this.input.value = this.colorPicker.value
    this.input.setCustomValidity("")
  }

  #handleTextInput = () => {
    const pickerValue = colorValueForPicker(this.input.value)
    this.input.setCustomValidity("")
    if (pickerValue) this.colorPicker.value = pickerValue
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.#handleApply()
    }
  }

  #handleApply = () => {
    const value = normalizeColorValue(this.input.value)
    if (!value) {
      this.input.setCustomValidity("Use a hex color like #212529 or an rgb color like rgb(33, 37, 41).")
      this.input.reportValidity()
      return
    }

    this.input.setCustomValidity("")
    this.input.value = value
    this.editor.dispatchCommand("toggleHighlight", { [this.property]: value })
    this.close()
  }

  #handleClear = () => {
    this.input.value = ""
    this.input.setCustomValidity("")
    this.editor.dispatchCommand("toggleHighlight", { [this.property]: null })
    this.close()
  }

  #syncInputs(value) {
    const pickerValue = colorValueForPicker(value)
    if (pickerValue) this.colorPicker.value = pickerValue
    else if (!value) this.colorPicker.value = this.defaultColor

    if (this.isClosed) {
      this.input.value = value || ""
      this.input.setCustomValidity("")
    }
  }
}

function normalizeColorValue(value) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const hexMatch = trimmed.match(HEX_COLOR_PATTERN)
  if (hexMatch) return expandHexColor(trimmed).toLowerCase()

  const rgb = parseRgbColor(trimmed)
  if (rgb) return `rgb(${rgb.join(", ")})`
}

function expandHexColor(value) {
  if (value.length !== 4) return value

  return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
}

function parseRgbColor(value) {
  const match = value.match(RGB_COLOR_PATTERN)
  if (!match) return null

  const separator = match[1].includes(",") ? /\s*,\s*/ : /\s+/
  const parts = match[1].trim().split(separator)
  if (parts.length !== 3) return null

  const channels = parts.map((part) => Number(part))
  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) return null
  return channels
}

function rgbToHex(channels) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

function colorValueForPicker(value) {
  if (!value) return null

  const hex = value.match(HEX_COLOR_PATTERN)
  if (hex) return expandHexColor(value).toLowerCase()

  const rgb = parseRgbColor(value)
  return rgb ? rgbToHex(rgb) : null
}

export default StyleDropdown
