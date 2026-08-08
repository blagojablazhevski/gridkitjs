/**
 * Collapses the `{...(condition && { "aria-foo": value })}` idiom for
 * conditionally including a single ARIA attribute in a JSX spread.
 */
export function ariaAttr<K extends string, V>(
  condition: boolean,
  key: K,
  value: V,
): Record<K, V> | Record<string, never> {
  return condition ? ({ [key]: value } as Record<K, V>) : {};
}
