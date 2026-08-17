import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { OntologyStore, type OntologyStoreOptions } from "@diffbot/typescript";
import type { DiffbotClient } from "@diffbot/typescript";

/**
 * Filesystem-backed ontology cache. Replaces the old `dqlRefreshOntology` +
 * `Ontology.fromPath` pair with a single read-through cache, consistent with
 * `KVOntologyStore` in core.
 */
export class FileOntologyStore extends OntologyStore {
  private readonly path: string;

  constructor(client: DiffbotClient, path: string, options?: OntologyStoreOptions) {
    super(client, options);
    this.path = path;
  }

  protected override async read(): Promise<string | undefined> {
    try {
      return await readFile(this.path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  protected override async write(text: string): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, text);
  }
}
