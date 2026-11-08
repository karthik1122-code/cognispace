// An error with an HTTP status. Services throw it; middleware/errors.js turns it into JSON.
// Services stay free of req/res, so they can be reused and tested without Express.
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra; // extra JSON fields, e.g. the current page on a 409
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg) => new HttpError(401, msg);
export const notFound = (msg) => new HttpError(404, msg);
export const conflict = (msg, extra) => new HttpError(409, msg, extra);
