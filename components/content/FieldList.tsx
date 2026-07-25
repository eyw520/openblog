import type { FieldSchema } from "@/lib/content/fields";
import { fieldLabel, formatFieldValue, isDateField, type FieldValue } from "@/lib/content/fields";
import { formatDate } from "@/lib/format-date";

/**
 * A collection's declared fields, shown under an entry's title.
 *
 * This is what makes declaring a field immediately worth doing: a travel
 * collection that declares `country` and `visited` gets them rendered without
 * anyone writing a component. A collection that wants them presented some other
 * way sets its own `layout` instead.
 *
 * Rendered as a description list because that is what it is — a set of
 * labelled values — which is also how a screen reader will announce it.
 */
export function FieldList({
  schema,
  fields,
  locale
}: {
  schema: FieldSchema;
  fields: Record<string, FieldValue>;
  locale: string;
}): React.ReactElement | null {
  // Schema order, not frontmatter order: the collection decides how its own
  // fields read, so two entries never present them differently.
  const shown = Object.entries(schema).filter(
    ([name, definition]) => definition.display !== false && fields[name] !== undefined
  );

  if (shown.length === 0) {
    return null;
  }

  return (
    <dl className="border-rule mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t pt-5">
      {shown.map(([name, definition]) => {
        const value = fields[name];
        if (value === undefined) {
          return null;
        }
        return (
          <div key={name}>
            <dt className="font-display text-ink-muted text-xs uppercase tracking-label">
              {fieldLabel(name, definition)}
            </dt>
            <dd className="mt-1">
              {isDateField(definition, value) ? formatDate(value, locale) : formatFieldValue(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
