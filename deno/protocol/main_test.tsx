import { assertEquals } from "@std/assert";
import { Bold, Line, Link, Message, Text } from "./main.tsx";
import { MessageType } from "./Message.ts";

Deno.test("Message.parse() should parse/serialize message", () => {
  const json = {
    "line": [
      "Hello, world!",
      { "bold": "This is bold" },
      { "text": "This is text" },
      { "link": { text: "This is a link" }, "_href": "https://example.com" },
    ],
  };
  const message = Message.parse(json);
  const serialized = message.toJSON();
  assertEquals(serialized, {
    line: [
      "Hello, world!",
      { "bold": "This is bold" },
      "This is text",
      { "link": "This is a link", "_href": "https://example.com" },
    ],
  });
});

Deno.test.ignore("Message.parse() build using jsx", () => {
  const message = (
    <Line>
      Hello, world!
      <Bold>This is bold</Bold>
      <Text>This is text</Text>
      <Link href="https://example.com">This is a link</Link>
    </Line>
  );
  const serialized = message.toJSON();
  assertEquals(serialized, {
    line: [
      "Hello, world!",
      { "bold": "This is bold" },
      "This is text",
      { "link": "This is a link", "_href": "https://example.com" },
    ],
  });
});

Deno.test("Message.toString() should return only visible text of message", () => {
  const json = {
    "line": [
      "Hello, world!",
      { "bold": "This is bold" },
      { "text": "This is text" },
      { "link": { text: "This is a link" }, "_href": "https://example.com" },
    ],
  };
  const message = Message.parse(json);
  assertEquals(
    message.toString(),
    "Hello, world!This is boldThis is textThis is a link",
  );
});

Deno.test("Message.validate() should validate message", () => {
  assertEquals(Message.validate({ text: "Hello, world!" }).valid, true);
});

Deno.test("Message.validate() invalidate message with multiple keys", () => {
  const validation = Message.validate({ text: "Hello, world!", bold: "bold" });
  assertEquals(validation.valid, false);
  assertEquals(validation.getError(), [{
    message: "Part can contain exactly one keyword",
    error: "MULTIPLE_KEYWORDS",
  }]);
});

Deno.test("Message.validate() validate link with argument", () => {
  const validation = Message.validate({
    link: "Hello, world!",
    _href: "http://example.com",
  });
  assertEquals(validation.valid, true);
  assertEquals(validation.getError(), null);
});

Deno.test.ignore(
  "Message.validate() invalidate link with wrong argument",
  () => {
    const validation = Message.validate({
      link: "Hello, world!",
      _hrep: "http://example.com",
    });
    assertEquals(validation.valid, false);
    assertEquals(validation.getError(), [{
      message: "Invalid argument",
      error: "INVALID_ARGUMENT",
    }]);
  },
);

Deno.test.ignore("Message.validate() should validate recursively", () => {
  const validation = Message.validate({
    line: [{
      link: "Hello, world!",
      _hrep: "http://example.com",
    }],
  });
  assertEquals(validation.valid, false);
  assertEquals(validation.getError(), [{
    message: "Invalid argument",
    error: "INVALID_ARGUMENT",
  }]);
});

const message: MessageType = {};

// validate
// build
// parse
