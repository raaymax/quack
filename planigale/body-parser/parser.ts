import { Middleware } from "@planigale/planigale";
import * as qs from "@planigale/querystring";

export const bodyParser: Middleware = async (req, next) => {
  const request = req.request;
  if (!req.route) {
    return await next();
  }
  req.body = await loadBody(request);
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
