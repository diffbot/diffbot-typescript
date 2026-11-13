/**
 * The shape of a handler's `extra` escape hatch: a free-form bag of wire query
 * parameters, minus the keys the handler already exposes as named options. Passing
 * a named key through `extra` is a compile-time error instead of a silent no-op or an
 * ambiguous "which one wins" footgun at runtime.
 */
export type ExtraParams<NamedKeys extends string> = Record<string, string> & Partial<Record<NamedKeys, never>>;
