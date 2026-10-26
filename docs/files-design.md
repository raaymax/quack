# Files as a Root Resource — Design

> Status: design / agreed direction. Part of the v4 "Channel Views → Files view"
> track (see `v4-scope.md` §1–§2). This supersedes the embedded-attachment
> approach for files.

## Goal

Turn files from **message attachments** (metadata embedded inside the message
document) into a **first-class, channel-scoped root entity** that messages
merely _reference_. This finishes the long-standing
`// TODO make this a separate entity` on the message attachment type and lays
the foundation for a per-channel **Files view**.

## Core model

A file stops being something a message _contains_ and becomes something a
channel _owns_, which messages _reference_:

```
Channel ──owns──► File (root entity, created at upload)
                    ▲
Message ──references──┘   (message.fileIds: [...])
```

- **File is a root entity**, created at **upload time**, scoped to a single
  channel.
- **Upload is channel-scoped** (`POST /api/channels/:channelId/files`), so the
  File row is born complete — `channelId`, `uploaderId`, `fileName`,
  `contentType`, `size`, `resolution` are all known at creation. This removes
  the old "upload doesn't know its channel" problem.
- **Messages reference files** by id (`message.fileIds`), they no longer embed
  file metadata.

## File schema

```ts
type File = {
  id: EntityId; // logical file identity
  storageId: string; // → blob in @quack/storage (kept separate from id)
  channelId: EntityId; // scope — set at upload, immutable
  uploaderId: EntityId; // set at upload
  fileName: string;
  contentType: string;
  size: number | null; // new uploads only; null on backfill
  resolution: { width: number; height: number } | null; // images only; null on backfill
  status: "draft" | "attached" | "deleted"; // lifecycle
  createdAt: Date; // upload time
};
```

Indexes:

- `{ channelId, status, createdAt }` — drives the per-channel Files view.
- `{ storageId, status }` — "is this blob still used" checks before deleting it.

Two deliberate "closer-to-ideal" choices:

- **`storageId` separate from `id`** — logical file identity is decoupled from
  the physical blob. Costs nothing now; it's the seam where content-addressing /
  dedup slots in later.
- **`status` lifecycle** — `draft` (uploaded, not yet shared) → `attached`
  (shared in the channel) → `deleted`. The Files view lists `attached` files to
  everyone and `draft` files only to their uploader.

Files belong to the **channel**. Messages (and later other resources) only
reference them through their own `fileIds`. A file has no back-reference to a
message, so many messages can reference the same file, and deleting a message
never deletes its files.

## Lifecycle

```
POST /api/channels/:channelId/files   (stream)
  → storage.upload() → storageId + compute resolution
  → create File { channelId, uploaderId, status: "draft", ... }
  → live "file" event to the uploader only
  → return fileId
  (?attach=channel attaches it right away — uploads from the Files view)

POST /api/channels/:channelId/files/:fileId/attach
  → own draft → "attached" (the Files view "Attach to channel" action)

POST /api/channels/:channelId/messages   { fileIds: [fileId], message: ... }
  → file:attach checks every referenced file before the message is saved:
    another channel / deleted / unknown → 404, someone else's draft → 403,
    own draft → "attached", already attached → just referenced
```

### Status

`status` is **kept from day one** (it's one enum on the row):

- Drafts are visible (listed, downloadable, live events) only to their
  uploader; everyone else sees `attached` files only.
- It makes orphans _identifiable_ for cleanup.

### Draft cleanup

A File row is created at **upload**, before any message exists, so an upload
that is never sent or attached stays a `draft`. `file:removeStaleDrafts` runs
on startup and every hour and deletes drafts older than **7 days**, together
with their blobs and thumbnail variants (unless an attached file still uses the
same `storageId`).

## Deletion

`file:remove` flips `status: "deleted"`. Removing a message does not touch its
files.
Physical blob + thumbnail cleanup happens when nothing references the
`storageId`:

- **Thumbnails are swept by prefix** in the storage layer. Variants are
  deterministically named `{storageId}-{w}x{h}`, so `storage.remove(storageId)`
  deletes `{storageId}-*` (fs: `readDir` prefix match; gcs: prefix list; memory:
  key prefix). Full-UUID ids make the prefix unambiguous.
- Physically delete the blob only when no remaining row references that
  `storageId` (cheap `count`).

## File addressing & download endpoints

`storageId` is a `@quack/storage` implementation detail and must never reach the
client — `toClientFile()` strips it from every client-facing payload
(`message.files`, the channel files list, the upload response), and
`ChannelFile` does not carry it.

- **New files** are addressed by **File entity id**:
  `GET /api/channels/:channelId/files/:fileId` resolves the entity → `storageId`
  and streams (with `?w=&h=` thumbnails and `?download=true`). The client builds
  URLs via `getFileUrl(channelId, fileId)`.
- **Legacy `/api/files/:storageId`** (the `@quack/storage` router) is
  **deprecated but kept**. It still serves the things that only have a raw
  `storageId`: old plaintext embedded attachments, decrypted DM attachments
  (storageId lives inside the encrypted body), and avatars/emojis (which store a
  `storageId`).
- **Removal plan (follow-up):** once encrypted DM attachments are migrated to
  the `fileIds` model and avatars/emojis become first-class uploads (v4 scope
  §6), nothing will reference a raw `storageId` and the legacy endpoint can be
  deleted.

## Thumbnails are **not** entities

Thumbnails / renditions are derived, regenerable artifacts — they get **no DB
rows**.

- Generated lazily on first view (`GET /api/files/:id?w=100&h=100`), named
  `{storageId}-{w}x{h}`.
- URLs are derivable from `id` alone; nothing to store.
- Registering them would mean an `isThumbnail`/`variantOf` discriminator + a
  filter on every query + a write-on-read callback from `@quack/storage` into
  the `file` domain (breaking the package boundary) — all cost, no benefit.

The original's row carries `resolution` so the client can size/request
thumbnails and reserve layout space (no reflow).

## E2E posture

All current encryption facts verified true: public/private messages are
plaintext to the server; DIRECT (DM) messages are E2E-encrypted; file
**content** is already not E2E (server generates thumbnails); attachment
**metadata** currently lives inside the encrypted message body for DMs.

**Consequence of channel-scoped upload:** filename / content-type now reach the
server in **plaintext for DMs too** — they no longer ride inside the encrypted
message body. This is accepted **for now** (DM file entries, no encryption yet).

**Encrypt-later path** (matches the ideal design, no rework of the above):

- give each file a content key (CEK), encrypt blob + metadata client-side,
- wrap the CEK with the channel key, store only ciphertext + wrapped key on the
  File row (plaintext `fileName`/`contentType`/`resolution` go null, add
  `encryptedMeta` / `wrappedKey` columns),
- move thumbnail generation client-side for encrypted channels.

## New uploads — registration paths

One shared primitive, two callers:

| Channel type     | How the row reaches `attached`                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| PUBLIC / PRIVATE | server-side, inside `message:create` (server sees `fileIds`)                                                     |
| DIRECT (DM)      | client references `fileIds`; metadata already on the File row from the channel-scoped upload (plaintext for now) |

`size` / `resolution` are read from storage metadata (`storage.stat`) at upload,
not trusted from the client.

## Backfill & backward compatibility

**Hard invariant: never lose access to existing attachments — especially DMs.**
Old DM attachment metadata lives **encrypted inside the message body** and can
never be read or migrated server-side. So the legacy path is **permanent, not
transitional**:

- **Dual-read forever.** Message rendering must support _both_ shapes
  indefinitely:
  - new messages → `fileIds` resolved against the `files` collection,
  - legacy messages → embedded `attachments` (for DMs, decrypted client-side
    from the message body, exactly as today). This is not a migration window
    that closes — the embedded reader stays for the life of the app, because DM
    history can only ever be read this way.
- **Never strip embedded `attachments`.** No migration deletes or rewrites the
  embedded attachment field out of existing messages. Backfill is **additive
  only** (it _adds_ `File` rows / `fileIds`, it does not remove the original
  embedded data), so old messages remain fully renderable even if the `files`
  collection is dropped or a backfill is rolled back.
- **Plaintext channels → additive backfill.** A migration reads embedded
  attachments and creates `File` rows (`status: "attached"`, `channelId` /
  `messageId` / `uploaderId` from the message, `size` / `resolution` null). It
  may _add_ `message.fileIds` alongside the existing `attachments`, but must
  leave `attachments` in place.
- **DMs → forward-only, legacy stays.** The server can't read old encrypted
  attachments, so historical DM files get no `File` rows and are rendered
  **only** via the permanent embedded reader. New DM files get rows going
  forward.

## What changes vs. the current codebase

1. Upload endpoint moves from global `/api/files` to channel-scoped
   `/api/channels/:channelId/files` and creates the File entity.
2. New `file/` core domain: `FileRepo` + commands/queries
   (`file:register`/`attach`, `file:remove`, `file:getChannel`).
3. Message schema: `attachments` → `fileIds` references (keep the old reader for
   compat).
4. Storage layer: compute `resolution` + expose `stat`; prefix-delete
   `{storageId}-*` on remove.
5. Migration for plaintext backfill.
6. **No** orphan GC sweeper (deferred — scale too small to matter).

## Deferred (genuinely heavier, not needed yet)

- Content-addressing / blob dedup (the `storageId`/`id` split is the seam for
  it).
- Presigned direct-to-storage uploads (app server out of the bytes path).
- Per-file encryption + client-side rendition generation for encrypted channels.
- Polymorphic reference edge (`{fileId, refType, refId}`) so canvas / kanban
  reuse the same file system — `message.fileIds` + `File.messageId` is the
  pragmatic 1:1 start that generalizes without a rewrite.
