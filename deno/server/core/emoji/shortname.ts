import * as v from "valibot";

export const Shortname = v.pipe(
  v.string(),
  v.transform((i) =>
    `:${(i as string).trim().replace(/^:/, "").replace(/:$/, "")}:`
  ),
  v.regex(
    /^:[a-zA-Z0-9_+-]+:$/,
    "invalid emoji shortname, expected :shortname:",
  ),
);
