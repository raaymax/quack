use quack_server::domain::message::{flatten, valid_body};
use serde_json::json;

#[test]
fn flatten_matches_client_rendering_rules() {
    let body = json!([
        { "line": [{ "text": "Hello " }, { "bold": { "text": "world" } }] },
        { "bullet": [{ "item": { "code": "x" } }] },
        { "img": "a.png", "_alt": "pic" },
        { "br": true },
        { "link": { "text": "site" }, "_href": "https://example.com" },
    ]);
    assert_eq!(flatten(&body), "Hello world\nxpic\nsite");
}

#[test]
fn body_validation_requires_exactly_one_node_kind() {
    let id = "0123456789abcdef01234567";
    assert!(valid_body(&json!([])));
    assert!(valid_body(&json!({ "text": "a" })));
    assert!(valid_body(&json!({ "user": id })));
    assert!(valid_body(
        &json!({ "thread": "t", "_channelId": id, "_parentId": id })
    ));
    assert!(!valid_body(&json!({})));
    assert!(!valid_body(&json!({ "text": "a", "code": "b" })));
    assert!(!valid_body(&json!({ "user": "not-an-id" })));
    assert!(!valid_body(&json!({ "link": { "text": "a" } })));
    assert!(!valid_body(&json!({ "img": { "src": "a.png" } })));
}
