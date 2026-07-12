require "application_system_test_case"

class ToggleMarkersTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
  end

  test "toggle markers survive the Action Text round trip" do
    html = [
      '<div data-lexxy-toggle="faq-1"><h2>Question</h2></div>',
      '<div data-lexxy-toggle-target="faq-1"><p>More information</p></div>'
    ].join

    find_editor.value = html
    click_on "Update Post"

    assert_selector "[data-lexxy-toggle='faq-1']", text: "Question"
    assert_selector "[data-lexxy-toggle-target='faq-1']", text: "More information"

    click_on "Edit this post"
    assert_equal_html html, find_editor.value
  end
end
