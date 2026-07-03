import { $applyNodeReplacement } from "lexical"
import { LinkNode } from "@lexical/link"

export class ClassableLinkNode extends LinkNode {
  __className

  static getType() {
    return "classable-link"
  }

  static clone(node) {
    return new ClassableLinkNode(node.__url, {
      className: node.__className,
      rel: node.__rel,
      target: node.__target,
      title: node.__title
    }, node.__key)
  }

  constructor(url = "", attributes = {}, key) {
    super(url, attributes, key)
    this.__className = normalizeClassName(attributes.className ?? attributes.class)
  }

  afterCloneFrom(prevNode) {
    super.afterCloneFrom(prevNode)
    this.__className = prevNode.__className
  }

  createDOM(config) {
    const anchor = super.createDOM(config)
    this.#updateClassName(null, anchor)
    return anchor
  }

  updateDOM(prevNode, anchor, config) {
    super.updateDOM(prevNode, anchor, config)
    this.#updateClassName(prevNode, anchor)
    return false
  }

  exportDOM(editor) {
    const exportOutput = super.exportDOM(editor)
    if (exportOutput.element) this.#updateClassName(null, exportOutput.element)
    return exportOutput
  }

  static importDOM() {
    return {
      a: domNode => {
        if (!domNode.getAttribute("class")) return null

        return {
          conversion: $convertClassableAnchorElement,
          priority: 2
        }
      }
    }
  }

  static importJSON(serializedNode) {
    return $createClassableLinkNode().updateFromJSON(serializedNode)
  }

  updateFromJSON(serializedNode) {
    return super.updateFromJSON(serializedNode)
      .setClassName(serializedNode.className || serializedNode.class || null)
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      className: this.getClassName()
    }
  }

  getClassName() {
    return this.getLatest().__className
  }

  setClassName(className) {
    const writable = this.getWritable()
    writable.__className = normalizeClassName(className)
    return writable
  }

  shouldMergeAdjacentLink(otherLink) {
    return super.shouldMergeAdjacentLink(otherLink) &&
      (this.getClassName() || null) === (otherLink.getClassName?.() || null)
  }

  #updateClassName(prevNode, anchor) {
    const oldClasses = classNameTokens(prevNode?.__className)
    const newClasses = classNameTokens(this.__className)

    oldClasses.forEach(className => {
      if (!newClasses.includes(className)) anchor.classList.remove(className)
    })

    newClasses.forEach(className => anchor.classList.add(className))
  }
}

export function $createClassableLinkNode(url = "", attributes = {}) {
  return $applyNodeReplacement(new ClassableLinkNode(url, attributes))
}

function $convertClassableAnchorElement(domNode) {
  let node = null

  if (domNode instanceof HTMLAnchorElement) {
    const content = domNode.textContent
    if ((content !== null && content !== "") || domNode.children.length > 0) {
      node = $createClassableLinkNode(domNode.getAttribute("href") || "", {
        className: domNode.getAttribute("class"),
        rel: domNode.getAttribute("rel"),
        target: domNode.getAttribute("target"),
        title: domNode.getAttribute("title")
      })
    }
  }

  return { node }
}

function normalizeClassName(className) {
  return classNameTokens(className).join(" ") || null
}

function classNameTokens(className) {
  return `${className || ""}`.trim().split(/\s+/).filter(Boolean)
}
