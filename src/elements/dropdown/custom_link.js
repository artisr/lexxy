import { $isRangeSelection, $isTextNode } from "lexical"
import { LinkNode } from "@lexical/link"
import { $getNearestNodeOfType } from "@lexical/utils"
import { ToolbarDropdown } from "../toolbar_dropdown"
import { registerEventListener } from "../../helpers/listener_helper"

const SAFE_SCHEMES = [ "http", "https", "mailto", "tel", "sms" ]
const CLASS_TOKEN_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/
const CUSTOM_BUTTON_CLASS = "custom-button"

export class CustomLinkDropdown extends ToolbarDropdown {
  editorReady() {
    this.track(
      registerEventListener(this.urlInput, "keydown", this.#handleEnter),
      registerEventListener(this.classInput, "keydown", this.#handleEnter),
      registerEventListener(this.applyButton, "click", this.#handleApply),
      registerEventListener(this.unlinkButton, "click", this.#handleUnlink)
    )
  }

  onClose() {
    this.urlInput.setCustomValidity("")
    this.classInput.setCustomValidity("")
  }

  syncSelection(selection) {
    const linkNode = selectedLinkNode(selection)
    const classNames = classNameTokens(linkNode?.getClassName?.())
    const isCustomButton = classNames.includes(CUSTOM_BUTTON_CLASS)
    const additionalClasses = classNames.filter((className) => className !== CUSTOM_BUTTON_CLASS).join(" ")

    this.trigger.setAttribute("aria-pressed", isCustomButton.toString())
    if (this.isClosed) {
      this.urlInput.value = isCustomButton ? linkNode.getURL() : ""
      this.classInput.value = isCustomButton ? additionalClasses : ""
      this.urlInput.setCustomValidity("")
      this.classInput.setCustomValidity("")
    }

    return isCustomButton
  }

  get urlInput() {
    return this.panel.querySelector("[data-custom-link-url]")
  }

  get classInput() {
    return this.panel.querySelector("[data-custom-link-class]")
  }

  get applyButton() {
    return this.panel.querySelector("[data-custom-link-apply]")
  }

  get unlinkButton() {
    return this.panel.querySelector("[data-custom-link-unlink]")
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.#handleApply()
    }
  }

  #handleApply = () => {
    const url = this.urlInput.value.trim()
    if (!validHref(url)) {
      this.urlInput.setCustomValidity("Use a relative path or a safe absolute URL.")
      this.urlInput.reportValidity()
      return
    }
    this.urlInput.setCustomValidity("")

    const className = customButtonClassName(this.classInput.value)
    if (!className) {
      this.classInput.setCustomValidity("Use valid CSS class tokens, for example primary_cta.")
      this.classInput.reportValidity()
      return
    }
    this.classInput.setCustomValidity("")

    this.editor.dispatchCommand("link", { url, className })
    this.close()
  }

  #handleUnlink = () => {
    this.editor.dispatchCommand("unlink")
    this.close()
  }
}

function selectedLinkNode(selection) {
  if (!$isRangeSelection(selection)) return null

  if (selection.isCollapsed()) {
    return $getNearestNodeOfType(selection.anchor.getNode(), LinkNode)
  }

  const linkNodes = new Set()
  for (const node of selection.getNodes()) {
    if ($isTextNode(node)) {
      linkNodes.add($getNearestNodeOfType(node, LinkNode))
    }
  }

  return linkNodes.size === 1 ? Array.from(linkNodes)[0] : null
}

function validHref(value) {
  if (!value || /^javascript:/i.test(value)) return false

  const schemeMatch = value.match(/^([A-Za-z][A-Za-z0-9+.-]*):/)
  return !schemeMatch || SAFE_SCHEMES.includes(schemeMatch[1].toLowerCase())
}

function customButtonClassName(value) {
  const additionalClasses = classNameTokens(value).filter((className) => className !== CUSTOM_BUTTON_CLASS)
  if (additionalClasses.some((className) => !CLASS_TOKEN_PATTERN.test(className))) return null

  return [ CUSTOM_BUTTON_CLASS, ...additionalClasses ].join(" ")
}

function classNameTokens(className) {
  return `${className || ""}`.trim().split(/\s+/).filter(Boolean)
}

export default CustomLinkDropdown
