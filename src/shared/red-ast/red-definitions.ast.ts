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
  NodeRef,
  DataBuffer,
  serializationDeferredDataBuffer,
  SharedDataBuffer,
  CDateTime,
  CGUID,
  CRUID,
  //CRUIDRef,
  EditorObjectID,
  //GamedataLocKeyWrapper,
  MessageResourcePath,
  //RuntimeEntityRef,
  Variant
}

export enum RedTemplateDef {
  ref = RedPrimitiveDef.Variant + 1,
  wref,
  script_ref,
  ResRef,
  ResAsyncRef,
  array,
  curveData,
  multiChannelCurve
}
