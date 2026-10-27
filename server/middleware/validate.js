/** Replaces req.body with the parsed, cleaned value, or answers 400 with the first problem. */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".");
    const message = issue.message.endsWith(".") ? issue.message : `${field ? `${field}: ` : ""}${issue.message}`;
    return res.status(400).json({ error: message });
  }
  req.body = result.data;
  next();
};

/** For router.param: a malformed id answers 404 instead of reaching the database. */
export const checkObjectId = (_req, res, next, id) =>
  (/^[a-f0-9]{24}$/i.test(id) ? next() : res.status(404).json({ error: "Not found." }));
