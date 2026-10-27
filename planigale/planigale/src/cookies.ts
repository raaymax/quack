import { type Cookie, deleteCookie, getCookies, setCookie } from "@std/http";

export type SetCookieOptions = Omit<Cookie, "name" | "value">;
export type DeleteCookieOptions = Pick<
  Cookie,
  | "path"
  | "domain"
  | "secure"
  | "httpOnly"
  | "partitioned"
>;

export class Cookies {
  constructor(private headers: Headers) {}
  get(name: string): string | undefined {
    return getCookies(this.headers)?.[name];
  }
  set(name: string, value: string, options: SetCookieOptions = {}): void {
    setCookie(this.headers, { name, value, ...options });
  }
  delete(name: string, options: DeleteCookieOptions): void {
    deleteCookie(this.headers, name, options);
  }
}
