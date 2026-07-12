import { $applyNodeReplacement, $createParagraphNode, ElementNode } from "lexical"

export const TOGGLE_MARKER_ATTRIBUTE = "data-lexxy-toggle"
export const TOGGLE_TARGET_MARKER_ATTRIBUTE = "data-lexxy-toggle-target"

export class ToggleMarkerNode extends ElementNode {
  __markerRole
  __markerId

  static getType() {
    return "toggle-marker"
  }

  static clone(node) {
    return new ToggleMarkerNode(node.__markerRole, node.__markerId, node.__key)
  }

  static importDOM() {
    return {
      div: (element) => {
        const marker = markerFromElement(element)
        if (!marker) return null

        return {
          conversion: () => ({ node: $createToggleMarkerNode(marker.role, marker.id) }),
          priority: 2
        }
      }
    }
  }

  static importJSON(serializedNode) {
    return $createToggleMarkerNode(serializedNode.markerRole, serializedNode.markerId).updateFromJSON(serializedNode)
  }

  constructor(markerRole = "toggle", markerId = "", key) {
    super(key)
    this.__markerRole = markerRole
    this.__markerId = markerId
  }

  afterCloneFrom(previousNode) {
    super.afterCloneFrom(previousNode)
    this.__markerRole = previousNode.__markerRole
    this.__markerId = previousNode.__markerId
  }

  createDOM() {
    const element = document.createElement("div")
    updateMarkerElement(element, null, this)
    return element
  }

  updateDOM(previousNode, element) {
    updateMarkerElement(element, previousNode, this)
    return false
  }

  exportDOM() {
    const element = document.createElement("div")
    element.setAttribute(this.getMarkerAttribute(), this.getMarkerId())
    return { element }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      markerRole: this.getMarkerRole(),
      markerId: this.getMarkerId()
    }
  }

  updateFromJSON(serializedNode) {
    return super.updateFromJSON(serializedNode)
      .setMarkerRole(serializedNode.markerRole)
      .setMarkerId(serializedNode.markerId)
  }

  insertNewAfter(_selection, restoreSelection) {
    const paragraph = $createParagraphNode()
    this.insertAfter(paragraph, restoreSelection)
    return paragraph
  }

  canIndent() {
    return false
  }

  getMarkerRole() {
    return this.getLatest().__markerRole
  }

  setMarkerRole(markerRole) {
    const writable = this.getWritable()
    writable.__markerRole = markerRole
    return writable
  }

  getMarkerId() {
    return this.getLatest().__markerId
  }

  setMarkerId(markerId) {
    const writable = this.getWritable()
    writable.__markerId = markerId
    return writable
  }

  getMarkerAttribute() {
    return markerAttributeFor(this.getMarkerRole())
  }
}

export function $createToggleMarkerNode(markerRole, markerId) {
  return $applyNodeReplacement(new ToggleMarkerNode(markerRole, markerId))
}

export function $isToggleMarkerNode(node) {
  return node instanceof ToggleMarkerNode
}

function markerFromElement(element) {
  if (element.hasAttribute(TOGGLE_MARKER_ATTRIBUTE)) {
    return { role: "toggle", id: element.getAttribute(TOGGLE_MARKER_ATTRIBUTE) }
  } else if (element.hasAttribute(TOGGLE_TARGET_MARKER_ATTRIBUTE)) {
    return { role: "target", id: element.getAttribute(TOGGLE_TARGET_MARKER_ATTRIBUTE) }
  }
}

function markerAttributeFor(markerRole) {
  return markerRole === "target" ? TOGGLE_TARGET_MARKER_ATTRIBUTE : TOGGLE_MARKER_ATTRIBUTE
}

function updateMarkerElement(element, previousNode, node) {
  if (previousNode) element.removeAttribute(previousNode.getMarkerAttribute())
  element.setAttribute(node.getMarkerAttribute(), node.getMarkerId())
}
