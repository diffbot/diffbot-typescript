import { readFile } from "node:fs/promises";
import type { JsonObject } from "./json.js";

type FieldMeta = JsonObject;
type FieldEntry = [string, FieldMeta];

export class Ontology {
  readonly data: JsonObject;

  constructor(data: JsonObject) {
    this.data = data;
  }

  static fromJson(raw: string | Uint8Array): Ontology {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    return new Ontology(JSON.parse(text) as JsonObject);
  }

  static async fromPath(path: string): Promise<Ontology> {
    const text = await readFile(path, "utf8");
    return Ontology.fromJson(text);
  }

  types(): string[] {
    const types = this.data.types as Record<string, unknown> | undefined;
    return Object.keys(types ?? {}).sort();
  }

  composites(): string[] {
    const composites = this.data.composites as Record<string, unknown> | undefined;
    return Object.keys(composites ?? {}).sort();
  }

  enums(): string[] {
    const enums = this.data.enums as Record<string, unknown> | undefined;
    return Object.keys(enums ?? {}).sort();
  }

  taxonomies(): string[] {
    const taxonomies = this.data.taxonomies as Record<string, unknown> | undefined;
    return Object.keys(taxonomies ?? {}).sort();
  }

  private static fieldsOf(container: Record<string, JsonObject>, typeName: string): Record<string, FieldMeta> {
    const entry = container[typeName];
    if (!entry) throw new Error(`Unknown name: ${typeName}`);
    return (entry.fields as Record<string, FieldMeta> | undefined) ?? {};
  }

  fieldsFor(typeName: string): Record<string, FieldMeta> {
    const types = (this.data.types ?? {}) as Record<string, JsonObject>;
    const composites = (this.data.composites ?? {}) as Record<string, JsonObject>;
    if (typeName in types) return Ontology.fieldsOf(types, typeName);
    if (typeName in composites) return Ontology.fieldsOf(composites, typeName);
    throw new Error(`${typeName} is not a known entity type or composite`);
  }

  static filterFields(
    fields: Record<string, FieldMeta>,
    search?: string | null,
    includeDeprecated = false,
  ): FieldEntry[] {
    const pattern = search ? new RegExp(search, "i") : null;
    const out: FieldEntry[] = [];
    for (const [name, meta] of Object.entries(fields)) {
      if (!includeDeprecated && meta.isDeprecated) continue;
      if (pattern && !pattern.test(name)) continue;
      out.push([name, meta]);
    }
    return out;
  }

  taxonomyValues(name: string, search?: string | null): string[] {
    const taxonomies = (this.data.taxonomies ?? {}) as Record<string, JsonObject>;
    const tax = taxonomies[name];
    if (!tax) throw new Error(`Unknown taxonomy: ${name}`);

    const pattern = search ? new RegExp(search, "i") : null;
    const out: string[] = [];

    const walk = (node: JsonObject): void => {
      const n = node.name;
      if (typeof n === "string" && (!pattern || pattern.test(n))) {
        out.push(n);
      }
      for (const child of (node.children as JsonObject[] | undefined) ?? []) {
        walk(child);
      }
    };

    for (const cat of (tax.categories as JsonObject[] | undefined) ?? []) {
      walk(cat);
    }
    return out;
  }

  enumValues(name: string): string[] {
    const enums = (this.data.enums ?? {}) as Record<string, JsonObject>;
    const enumEntry = enums[name];
    if (!enumEntry) throw new Error(`Unknown enum: ${name}`);
    return [...((enumEntry.values as string[] | undefined) ?? [])];
  }

  findNamed(search: string): string[] {
    const pattern = new RegExp(search, "i");
    const found = new Set<string>();

    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const v of node) walk(v);
      } else if (node && typeof node === "object") {
        const obj = node as JsonObject;
        const n = obj.name;
        if (typeof n === "string" && pattern.test(n)) found.add(n);
        for (const v of Object.values(obj)) walk(v);
      }
    };

    walk(this.data);
    return [...found].sort();
  }

  static formatField(name: string, meta: FieldMeta): string {
    let typeName = String(meta.type ?? "?");
    if (typeName === "LinkedEntity") {
      const le = meta.leType as string[] | undefined;
      if (le?.length) typeName = `LinkedEntity (${le[0]})`;
    }
    const flags: string[] = [];
    if (meta.isList) flags.push("isList");
    if (meta.isComposite) flags.push("isComposite");
    if (meta.isEnum) flags.push("isEnum");
    if (meta.isDeprecated) flags.push("DEPRECATED");
    const suffix = flags.map((f) => ` [${f}]`).join("");
    return `${name}: [${typeName}]${suffix}`;
  }
}
