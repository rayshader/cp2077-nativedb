import {Pipe, PipeTransform} from '@angular/core';
import {RedTypeAst} from "../../shared/red-ast/red-type.ast";
import {RedPrimitiveDef, RedTemplateDef} from "../../shared/red-ast/red-definitions.ast";
import {CodeSyntax} from "../../shared/services/settings.service";

@Pipe({
  name: 'ndbFormatCode',
  standalone: true
})
export class NDBFormatCodePipe implements PipeTransform {

  transform(type: RedTypeAst, syntax: CodeSyntax): string {
    syntax = syntax - 1;
    switch (syntax) {
      case CodeSyntax.pseudocode:
        if (type.flag === RedTemplateDef.ref) {
          return 'handle';
        } else if (type.flag === RedTemplateDef.wref) {
          return 'whandle';
        } else if (type.flag === RedTemplateDef.ResRef) {
          return 'rRef';
        } else if (type.flag === RedTemplateDef.ResAsyncRef) {
          return 'raRef';
        } else {
          return type.name;
        }
      case CodeSyntax.redscript:
        if (type.flag === RedTemplateDef.ResRef) {
          return 'ResourceRef';
        } else if (type.flag === RedTemplateDef.ResAsyncRef) {
          return 'ResourceAsyncRef';
        }
        return type.name;
      case CodeSyntax.cppRED4ext:
      case CodeSyntax.cppRedLib:
        if (type.flag === RedTemplateDef.ref) {
          return 'Handle';
        } else if (type.flag === RedTemplateDef.wref) {
          return 'WeakHandle';
        } else if (type.flag === RedTemplateDef.script_ref) {
          return 'ScriptRef';
        } else if (type.flag === RedTemplateDef.ResRef) {
          return 'ResourceReference';
        } else if (type.flag === RedTemplateDef.ResAsyncRef) {
          return 'ResourceAsyncReference';
        } else if (type.flag === RedTemplateDef.array) {
          return 'DynArray';
        } else if (type.flag === RedTemplateDef.curveData) {
          return 'CurveData';
        } else if (type.flag === RedPrimitiveDef.String) {
          return 'CString';
        } else if (type.flag === RedPrimitiveDef.serializationDeferredDataBuffer) {
          return 'DeferredDataBuffer';
        } else if (type.flag !== undefined && type.flag >= RedPrimitiveDef.Void && type.flag <= RedPrimitiveDef.Double) {
          let name: string = RedPrimitiveDef[type.flag];

          if (type.flag >= RedPrimitiveDef.Int8 && type.flag <= RedPrimitiveDef.Uint64) {
            name += '_t';
          }
          return name.toLowerCase();
        } else {
          return type.name;
        }
    }
    return type.name;
  }

}
