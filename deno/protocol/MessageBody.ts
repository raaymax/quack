import { ValidationResult } from "./ValidationResult.ts";
import type { Message } from "./Message.ts";
import { Element, H } from "./types.ts";

export type MessageBody =
  | MessageBodyPart<any, any>
  | MessageBodyPart<any, any>[]
  | string;
export type Args = { [key: string]: any };
export interface MessageBodyPartConstructor {
  propName: string;
  new (args: any, children: any): MessageBody;
  parse(json: any): MessageBody;
}

const makeJSON = (json: any) => {
  const ret = [json].flat().map((child) => child.toJSON?.() ?? child).flat();
  return ret.length === 1 ? ret[0] : ret;
};

export abstract class MessageBodyPart<A extends Args = object, C = any> {
  static propName = "part";
  static schema = {
    [this.propName]: { $ref: "#body" },
  };
  static children = "#body";
  static args = {};

  args: A;
  children: C;

  toJSON(): any {
    const propName = (this.constructor as MessageBodyPartConstructor).propName;
    return {
      [propName]: makeJSON(this.children),
      ...Object.fromEntries(
        Object.entries(this.args)
          .map(([key, value]) => [`_${key}`, value]),
      ),
    };
  }

  constructor(args: A, children: C) {
    this.args = args ?? {};
    this.children = children;
  }

  static validate(json: any): ValidationResult {
    if (json === null || json === undefined || typeof json != "object") {
      return new ValidationResult(false, [{
        message: "Invalid message part",
        error: "INVALID_PART",
      }]);
    }
    const props = Object.entries(json).filter(([key, _]) =>
      !key.startsWith("_")
    );

    if (props.length != 1) {
      return new ValidationResult(false, [{
        message: "Part can contain exactly one keyword",
        error: "MULTIPLE_KEYWORDS",
      }]);
    }

    return new ValidationResult(true);
  }

  static parse<J extends { [key: string]: any }>(
    json: J,
    index: typeof Message,
  ): MessageBody {
    const args = Object.fromEntries(
      Object.entries(json)
        .filter(([key, _]) => key.startsWith("_"))
        .map(([key, value]) => [key.slice(1), value]),
    );

    return new (this as any)(args, index.parsePart(json[this.propName]));
  }

  static parseFromHtml(html: Element, parse: never): MessageBody | undefined {
    return undefined;
  }

  toString() {
    if (Array.isArray(this.children)) {
      return this.children.map((child) => child.toString()).join("");
    }
    return (this.children as any).toString?.() ?? this.children;
  }
  toHtml(h: H): string {
    const tagName = (this.constructor as any).propName;
    return h(
      tagName,
      this.args,
      [this.children].flat().map((c) => (c as any).toHtml()),
    );
  }
}
