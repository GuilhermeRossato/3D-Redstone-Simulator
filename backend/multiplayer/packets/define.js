import { loadBlockTypeMetadata } from "../../lib/blocks/BlockTypeMetadata.js";
import { getBlockTypeDataFrom } from "../../lib/blocks/BlockTypeStorage.js";

export default async function define(payload, ctx) {
  const subject = payload.id || payload.key;
  if (!subject) {
    throw new Error("Missing subject id or key in \"define\" packet");
  }
  const info = await getBlockTypeDataFrom(subject);
  const metadata = await loadBlockTypeMetadata(subject);
  return {
    info,
    metadata,
  }
}
