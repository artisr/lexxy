import { $addUpdateTag, $getSelection, $isRangeSelection, COMMAND_PRIORITY_NORMAL, HISTORY_PUSH_TAG, defineExtension } from "lexical"
import { $descendantsMatching, $getNearestNodeOfType, $unwrapNode, mergeRegister } from "@lexical/utils"

import LexxyExtension from "./lexxy_extension"
import { $createToggleMarkerNode, $isToggleMarkerNode, TOGGLE_MARKER_ATTRIBUTE, TOGGLE_TARGET_MARKER_ATTRIBUTE, ToggleMarkerNode } from "../nodes/toggle_marker_node"
import { $isProvisionalParagraphNode } from "../nodes/provisional_paragraph_node"

export const SET_TOGGLE_MARKER_COMMAND = "setToggleMarker"
export const CLEAR_TOGGLE_MARKER_COMMAND = "clearToggleMarker"

export class ToggleMarkersExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get allowedElements() {
    return [ { tag: "div", attributes: [ TOGGLE_MARKER_ATTRIBUTE, TOGGLE_TARGET_MARKER_ATTRIBUTE ] } ]
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/toggle-markers",
      nodes: [ ToggleMarkerNode ],
      register(editor) {
        return mergeRegister(
          editor.registerCommand(SET_TOGGLE_MARKER_COMMAND, $setToggleMarker, COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(CLEAR_TOGGLE_MARKER_COMMAND, $clearToggleMarker, COMMAND_PRIORITY_NORMAL),
          editor.registerNodeTransform(ToggleMarkerNode, $unwrapNestedToggleMarkers)
        )
      }
    })
  }
}

function $setToggleMarker({ role, id }) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return false

  $addUpdateTag(HISTORY_PUSH_TAG)
  const elements = $selectedTopLevelElements(selection)
  if (elements.length === 0) return false

  if (elements.length === 1 && $isToggleMarkerNode(elements[0])) {
    elements[0].setMarkerRole(role).setMarkerId(id)
    return true
  }

  const marker = $createToggleMarkerNode(role, id)
  elements[0].insertBefore(marker)

  for (const element of elements) {
    if ($isToggleMarkerNode(element)) {
      marker.append(...element.getChildren())
      element.remove()
    } else {
      marker.append(element)
    }
  }

  return true
}

function $clearToggleMarker(role) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return false

  const marker = $getNearestNodeOfType(selection.anchor.getNode(), ToggleMarkerNode)
  if (!marker || marker.getMarkerRole() !== role) return false

  $addUpdateTag(HISTORY_PUSH_TAG)
  $unwrapNode(marker)
  return true
}

function $selectedTopLevelElements(selection) {
  const elements = new Set()

  for (const node of selection.getNodes()) {
    const topLevelElement = node.getTopLevelElement()
    if (topLevelElement && !$isProvisionalParagraphNode(topLevelElement)) {
      elements.add(topLevelElement)
    }
  }

  if (elements.size === 0) {
    const topLevelElement = selection.anchor.getNode().getTopLevelElement()
    if (topLevelElement && !$isProvisionalParagraphNode(topLevelElement)) {
      elements.add(topLevelElement)
    }
  }

  return Array.from(elements)
}

function $unwrapNestedToggleMarkers(marker) {
  const nestedMarkers = $descendantsMatching(marker.getChildren(), $isToggleMarkerNode)
  nestedMarkers.reverse().forEach($unwrapNode)
}
