export type ColumnOption<ColumnId extends string> = {
  id: ColumnId;
  isRequired?: boolean;
  label: string;
};

export type SearchField = {
  examples: string[];
  field: string;
  type: "date" | "number" | "string";
};

export type SearchVisualSegment =
  | {
      end: number;
      start: number;
      type: "chip";
      value: string;
    }
  | {
      type: "text";
      value: string;
    };

export type TableSort<Field extends string> = {
  direction: "asc" | "desc";
  field: Field;
};
