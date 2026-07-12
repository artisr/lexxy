import Toolbar from "./toolbar"
import ToolbarDropdown from "./toolbar_dropdown"
import FontSizeDropdown from "./dropdown/font_size"
import StyleDropdown from "./dropdown/style"
import CustomLinkDropdown from "./dropdown/custom_link"
import ToggleMarkerDropdown from "./dropdown/toggle_marker"
import HighlightDropdown from "./dropdown/highlight"
import LinkDropdown from "./dropdown/link"
import Editor from "./editor"
import Prompt from "./prompt"
import CodeLanguagePicker from "./code_language_picker"
import NodeDeleteButton from "./node_delete_button"
import TableTools from "./table/table_tools"

export function defineElements() {
  const elements = {
    // Toolbar must be registered BEFORE Editor
    "lexxy-toolbar": Toolbar,
    "lexxy-toolbar-dropdown": ToolbarDropdown,
    "lexxy-font-size-dropdown": FontSizeDropdown,
    "lexxy-style-dropdown": StyleDropdown,
    "lexxy-custom-link-dropdown": CustomLinkDropdown,
    "lexxy-toggle-marker-dropdown": ToggleMarkerDropdown,
    "lexxy-highlight-dropdown": HighlightDropdown,
    "lexxy-link-dropdown": LinkDropdown,

    "lexxy-editor": Editor,

    // Prompt must be registered AFTER Editor
    "lexxy-prompt": Prompt,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-node-delete-button": NodeDeleteButton,
    "lexxy-table-tools": TableTools
  }

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element)
  })
}
