/** Framework-independent option data shared by catalogs and controls. */
export interface Option<Value extends string | number> {
  readonly value: Value;
  readonly label: string;
  readonly disabled?: boolean;
}
