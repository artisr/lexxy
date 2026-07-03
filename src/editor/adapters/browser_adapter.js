import { dispatch } from "../../helpers/html_helper"

export class BrowserAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
  }

  dispatchAttributesChange(attributes, link, highlight, headingTag, fontSize) {
    dispatch(this.editorElement, "lexxy:attributes-change", {
      attributes,
      link: typeof link === "string" ? { href: link } : link,
      highlight,
      headingTag,
      fontSize
    })
  }

  dispatchEditorInitialized(detail) {
    dispatch(this.editorElement, "lexxy:editor-initialized", detail)
  }

  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}
