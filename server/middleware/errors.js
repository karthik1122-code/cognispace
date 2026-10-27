// Last stop for every error (Express 5 forwards rejected async handlers here). Always answers in JSON.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err.type === "entity.too.large" || err.status === 413) return res.status(413).json({ error: "That request is too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "The request body is not valid JSON." });
  if (err.name === "CastError") return res.status(404).json({ error: "Not found." });
  if (err.name === "ValidationError") return res.status(400).json({ error: Object.values(err.errors)[0]?.message || "Invalid input." });
  if (err.code === 11000) return res.status(409).json({ error: "That already exists." });
  console.error(`${req.method} ${req.path} failed:`, err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
