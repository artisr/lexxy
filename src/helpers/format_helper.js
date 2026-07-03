import { $isRangeSelection, $isTextNode } from "lexical"
import { $getSelectionStyleValueForProperty, getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { createElement } from "./html_helper"
import { styleResolverRoot } from "./style_resolver_root"

export function isSelectionHighlighted(selection) {
  if (!$isRangeSelection(selection)) return false

  return getHighlightStyles(selection) !== null
}

export function getHighlightStyles(selection) {
  if (!$isRangeSelection(selection)) return null

  let styles = getStyleObjectFromCSS(selection.style)
  if (selection.isCollapsed()) {
    const anchorNode = selection.anchor.getNode()
    if ($isTextNode(anchorNode)) {
      styles = getStyleObjectFromCSS(anchorNode.getStyle())
      if (styles.color || styles["background-color"] || anchorNode.getTextContentSize() > 0) {
        return styles.color || styles["background-color"]
          ? { color: styles.color || null, backgroundColor: styles["background-color"] || null }
          : null
      }
    }
  }

  const color = selection.isCollapsed()
    ? styles.color || null
    : getUniformSelectedTextStyle(selection, "color")
  const backgroundColor = selection.isCollapsed()
    ? styles["background-color"] || null
    : getUniformSelectedTextStyle(selection, "background-color")
  if (!color && !backgroundColor) return null

  return { color, backgroundColor }
}

export function getSelectionStyle(selection, property) {
  if (!$isRangeSelection(selection)) return null

  if (selection.isCollapsed()) {
    const anchorNode = selection.anchor.getNode()
    if ($isTextNode(anchorNode)) {
      const value = getStyleObjectFromCSS(anchorNode.getStyle())[property]
      if (value) return value
      if (anchorNode.getTextContentSize() > 0) return null
    }

    return $getSelectionStyleValueForProperty(selection, property, null)
  }

  return getUniformSelectedTextStyle(selection, property)
}

function getUniformSelectedTextStyle(selection, property) {
  const values = new Set()

  selection.getNodes().forEach(node => {
    if ($isTextNode(node)) {
      const value = getStyleObjectFromCSS(node.getStyle())[property]
      values.add(value || null)
    }
  })

  values.delete(undefined)
  return values.size === 1 ? Array.from(values)[0] : null
}

export function hasHighlightStyles(cssOrStyles) {
  const styles = typeof cssOrStyles === "string" ? getStyleObjectFromCSS(cssOrStyles) : cssOrStyles
  return !!(styles.color || styles["background-color"])
}

export function applyCanonicalizers(styles, canonicalizers = []) {
  return canonicalizers.reduce((css, canonicalizer) => {
    return canonicalizer.applyCanonicalization(css)
  }, styles)
}

export class StyleCanonicalizer {
  constructor(property, allowedValues= []) {
    this._property = property
    this._allowedValues = allowedValues
    this._canonicalValues = this.#allowedValuesIdentityObject
  }

  applyCanonicalization(css) {
    const styles = { ...getStyleObjectFromCSS(css) }

    styles[this._property] = this.getCanonicalAllowedValue(styles[this._property])
    if (!styles[this._property]) {
      delete styles[this._property]
    }

    return getCSSFromStyleObject(styles)
  }

  getCanonicalAllowedValue(value) {
    return this._canonicalValues[value] ||= this.#resolveCannonicalValue(value)
  }

  // Private

  get #allowedValuesIdentityObject() {
    return this._allowedValues.reduce((object, value) => ({ ...object, [value]: value }), {})
  }

  #resolveCannonicalValue(value) {
    let index = this.#computedAllowedValues.indexOf(value)
    if (index === -1) {
      index = this.#computedAllowedValues.indexOf(computeStyleValues(this._property, [ value ])[0])
    }
    return index === -1 ? null : this._allowedValues[index]
  }

  get #computedAllowedValues() {
    return this._computedAllowedValues ||= computeStyleValues(this._property, this._allowedValues)
  }
}

// Separates DOM writes from layout reads to avoid forced reflows, and attaches
// resolver elements to a strictly-contained root (outside the normal document
// flow) so neither the attach nor the detach invalidate styles on the rest of
// the page. Without containment, appending to `document.body` triggered a
// page-wide style recalc on every canonicalization pass.
function computeStyleValues(property, values) {
  const fragment = document.createDocumentFragment()

  const elements = values.map(value => {
    const element = createElement("span", { style: `display: none; ${property}: ${value};` })
    fragment.appendChild(element)
    return element
  })

  styleResolverRoot().appendChild(fragment)

  const computed = elements.map(element =>
    window.getComputedStyle(element).getPropertyValue(property)
  )

  elements.forEach(element => element.remove())
  return computed
}
