import { AstHelper } from '../../../tests/ast.helper';
import { RedArgumentAst } from '../red-ast/red-argument.ast';
import { RedVisibilityDef } from '../red-ast/red-definitions.ast';
import { RedFunctionAst } from '../red-ast/red-function.ast';
import { CodeFormatter } from './formatter';
import { Red4extRsFormatter } from './red4ext-rs.formatter';

describe('Red4extRsFormatter', () => {
  let fmt: CodeFormatter;

  beforeAll(() => {
    fmt = new Red4extRsFormatter();
  });

  describe('formatCall()', () => {
    it('should format global function', () => {
      // GIVEN
      const globalFn: RedFunctionAst = AstHelper.buildFunction(
        'GetPlayer',
        AstHelper.buildRef('PlayerPuppet'),
        true,
        RedVisibilityDef.public,
        [
          {
            isOut: false,
            isOptional: false,
            name: 'game',
            type: AstHelper.buildType('ScriptGameInstance', 'GameInstance'),
          },
        ]
      );

      // WHEN
      const code: string = fmt.formatPrototype(globalFn);

      // THEN
      expect(code).toBe(
        '#[redscript_global]\n' +
          'pub fn get_player(game: GameInstance) -> MaybeUninitRef<PlayerPuppet>'
      );
    });
  });
  describe('formatPrototype()', () => {
    it('should format empty function', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction('ArraySortInts');

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('#[redscript_global]\npub fn array_sort_ints() -> ()');
    });
    it('should format function with return type', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction(
        'CanLog',
        AstHelper.Bool
      );

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('#[redscript_global]\npub fn can_log() -> bool');
    });
  });
});
