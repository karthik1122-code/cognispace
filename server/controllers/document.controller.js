import * as docs from "../services/document.service.js";

// HTTP layer for pages. Each handler: read the request, call the service, send JSON.
const { toClient } = docs;

export const list = async (req, res) => res.json((await docs.listDocuments(req.userId)).map(toClient));
export const create = async (req, res) => res.status(201).json(toClient(await docs.createDocument(req.userId, req.body)));
export const get = async (req, res) => res.json(toClient(await docs.getDocument(req.userId, req.params.id)));
export const update = async (req, res) => res.json(toClient(await docs.updateDocument(req.userId, req.params.id, req.body)));
export const versions = async (req, res) => res.json(await docs.listVersions(req.userId, req.params.id));
export const restore = async (req, res) => res.json(toClient(await docs.restoreVersion(req.userId, req.params.id, req.params.versionId)));
export const share = async (req, res) => res.json({ shareId: await docs.enableSharing(req.userId, req.params.id) });
export async function unshare(req, res) {
  await docs.disableSharing(req.userId, req.params.id);
  res.json({ shareId: null });
}
export async function remove(req, res) {
  const deleted = await docs.deleteDocumentTree(req.userId, req.params.id);
  res.json({ message: "Document deleted successfully.", deleted });
}

// Public: GET /api/share/:shareId
export async function viewShared(req, res) {
  const page = await docs.getShared(req.params.shareId);
  res.setHeader("Cache-Control", "no-store");
  res.json(page);
}
