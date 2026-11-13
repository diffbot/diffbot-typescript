import { parseJsonText } from "./decode.js";
import type {
  FieldMeta,
  OntologyDocument,
  OntologyTypeDef,
  TaxonomyNode,
} from "./types/undocumented.js";

export type { FieldMeta, OntologyDocument } from "./types/undocumented.js";

type FieldEntry = [string, FieldMeta];

export class Ontology {
  readonly data: OntologyDocument;

  constructor(data: OntologyDocument) {
    this.data = data;
  }

  static fromJson(raw: string | Uint8Array): Ontology {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    return new Ontology(parseJsonText<OntologyDocument>(text));
  }

  types(): string[] {
    return Object.keys(this.data.types ?? {}).sort();
  }

  composites(): string[] {
    return Object.keys(this.data.composites ?? {}).sort();
  }

  enums(): string[] {
    return Object.keys(this.data.enums ?? {}).sort();
  }

  taxonomies(): string[] {
    return Object.keys(this.data.taxonomies ?? {}).sort();
  }

  private static fieldsOf(
    container: Record<string, OntologyTypeDef>,
    typeName: string,
  ): Record<string, FieldMeta> {
    const entry = container[typeName];
    if (!entry) throw new Error(`Unknown name: ${typeName}`);
    return entry.fields ?? {};
  }

  fieldsFor(typeName: string): Record<string, FieldMeta> {
    const types = this.data.types ?? {};
    const composites = this.data.composites ?? {};
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
    const tax = (this.data.taxonomies ?? {})[name];
    if (!tax) throw new Error(`Unknown taxonomy: ${name}`);

    const pattern = search ? new RegExp(search, "i") : null;
    const out: string[] = [];

    const walk = (node: TaxonomyNode): void => {
      const n = node.name;
      if (typeof n === "string" && (!pattern || pattern.test(n))) {
        out.push(n);
      }
      for (const child of node.children ?? []) {
        walk(child);
      }
    };

    for (const cat of tax.categories ?? []) {
      walk(cat);
    }
    return out;
  }

  enumValues(name: string): string[] {
    const enumEntry = (this.data.enums ?? {})[name];
    if (!enumEntry) throw new Error(`Unknown enum: ${name}`);
    return [...(enumEntry.values ?? [])];
  }

  findNamed(search: string): string[] {
    const pattern = new RegExp(search, "i");
    const found = new Set<string>();

    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const v of node) walk(v);
      } else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
          if (key === "name" && typeof value === "string" && pattern.test(value)) {
            found.add(value);
          }
          walk(value);
        }
      }
    };

    walk(this.data);
    return [...found].sort();
  }

  static formatField(name: string, meta: FieldMeta): string {
    let typeName = meta.type ?? "?";
    if (typeName === "LinkedEntity") {
      const first = meta.leType?.[0];
      if (first) typeName = `LinkedEntity (${first})`;
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
