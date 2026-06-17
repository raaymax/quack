import { EntityId, FileEntry } from "../../types.ts";
import { Repository } from "../../infra/mod.ts";

type WithFiles = {
  fileIds?: EntityId[];
  files?: FileEntry[];
};

export async function resolveFiles(
  repo: Repository,
  messages: Array<unknown>,
): Promise<void> {
  const list = messages.filter((m): m is WithFiles => !!m) as WithFiles[];
  const ids: EntityId[] = [];
  for (const m of list) {
    if (m.fileIds?.length) ids.push(...m.fileIds);
  }
  if (!ids.length) return;

  const files = await repo.file.getManyByIds(ids);
  const byId = new Map(files.map((f) => [f.id.toString(), f]));

  for (const m of list) {
    if (!m.fileIds?.length) continue;
    m.files = m.fileIds
      .map((id) => byId.get(id.toString()))
      .filter((f): f is FileEntry => !!f && f.status !== "deleted");
  }
}
