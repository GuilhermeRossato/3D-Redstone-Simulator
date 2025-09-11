import { loadBlockMetadata } from "../../lib/blocks/BlockMetadataStorage.js";
import { getBlockTypeKeyDataFrom } from "../../lib/blocks/BlockSharedStorage.js";

export default async function define(payload, ctx) {
  const subject = payload.id || payload.key;
  if (!subject) {
    throw new Error("Missing subject id or key in \"define\" packet");
  }
  const info = await getBlockTypeKeyDataFrom(subject);
  const metadata = await loadBlockMetadata(subject);
  return {
    info,
    metadata,
  }
}
