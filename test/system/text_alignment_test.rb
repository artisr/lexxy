require "application_system_test_case"

class TextAlignmentTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
  end

  test "text alignment is preserved after saving" do
    find_editor.select "everyone"
    find_editor.toggle_command "alignCenter"

    click_on "Update Post"

    aligned_paragraph = find(".lexxy-content p", text: "Hello everyone")
    assert_includes aligned_paragraph[:style], "text-align"
    assert_includes aligned_paragraph[:style], "center"

    click_on "Edit this post"
    assert_equal_html '<p style="text-align: center;">Hello everyone</p>', find_editor.value
  end
end
