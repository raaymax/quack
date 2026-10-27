import { Middleware } from "@planigale/planigale";
import * as qs from "@planigale/querystring";

export const bodyParser: Middleware = async (req, next) => {
  if (!req.route?.definition.schema?.body) {
    return await next();
  }
  req.body = await loadBody(req.request);
  return await next();
};

const methods = ["POST", "PUT", "PATCH", "DELETE"];

const loadBody = async (request: Request) => {
  if (!methods.includes(request.method)) {
    return request.body;
  }
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await request.json();
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    return qs.parse(await request.text());
  } else if (contentType?.includes("text/plain")) {
    return await request.text();
  } else {
    return request.body;
  }
};
