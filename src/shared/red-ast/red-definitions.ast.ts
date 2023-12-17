export enum RedVisibilityDef {
  public,
  protected,
  private
}

export enum RedOriginDef {
  script,
  native,
  importOnly
}

export enum RedPrimitiveDef {
  Void,
  Bool,
  Int8,
  Uint8,
  Int16,
  Uint16,
  Int32,
  Uint32,
  Int64,
  Uint64,
  Float,
  Double,
  String,
  LocalizationString,
  CName,
  TweakDBID,
  Variant
}

export enum RedTemplateDef {
  ref = 19,
  wref,
  script_ref,
  ResRef,
  ResAsyncRef,
  array,
  curveData
}
