import { $isRangeSelection } from "lexical"
import { $getNearestNodeOfType } from "@lexical/utils"

import { ToolbarDropdown } from "../toolbar_dropdown"
import { registerEventListener } from "../../helpers/listener_helper"
import { ToggleMarkerNode } from "../../nodes/toggle_marker_node"
import { CLEAR_TOGGLE_MARKER_COMMAND, SET_TOGGLE_MARKER_COMMAND } from "../../extensions/toggle_markers_extension"

const MARKER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/

export class ToggleMarkerDropdown extends ToolbarDropdown {
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
    const marker = selectedToggleMarker(selection)
    const isActive = marker?.getMarkerRole() === this.markerRole

    this.trigger.setAttribute("aria-pressed", isActive.toString())
    if (this.isClosed) {
      this.input.value = isActive ? marker.getMarkerId() : ""
      this.input.setCustomValidity("")
    }
  }

  get markerRole() {
    return this.dataset.markerRole
  }

  get input() {
    return this.panel.querySelector("[data-toggle-marker-id]")
  }

  get applyButton() {
    return this.panel.querySelector("[data-toggle-marker-apply]")
  }

  get clearButton() {
    return this.panel.querySelector("[data-toggle-marker-clear]")
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.#handleApply()
    }
  }

  #handleApply = () => {
    const id = this.input.value.trim()
    if (!MARKER_ID_PATTERN.test(id)) {
      this.input.setCustomValidity("Use letters or numbers followed by letters, numbers, dots, underscores, colons, or hyphens.")
      this.input.reportValidity()
      return
    }

    this.input.setCustomValidity("")
    this.input.value = id
    this.editor.dispatchCommand(SET_TOGGLE_MARKER_COMMAND, { role: this.markerRole, id })
    this.close()
  }

  #handleClear = () => {
    this.input.value = ""
    this.input.setCustomValidity("")
    this.editor.dispatchCommand(CLEAR_TOGGLE_MARKER_COMMAND, this.markerRole)
    this.close()
  }
}

function selectedToggleMarker(selection) {
  if (!$isRangeSelection(selection)) return null
  return $getNearestNodeOfType(selection.anchor.getNode(), ToggleMarkerNode)
}

export default ToggleMarkerDropdown
