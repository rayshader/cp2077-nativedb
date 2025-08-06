import {CodeFormatter} from "./formatter";
import {AstHelper} from "../../../tests/ast.helper";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedVisibilityDef} from "../red-ast/red-definitions.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedscriptFormatter} from "./redscript.formatter";

describe('RedscriptFormatter', () => {
  let fmt: CodeFormatter;

  beforeAll(() => {
    fmt = new RedscriptFormatter();
  });

  describe('formatCall()', () => {
    it('should format global function', () => {
      // GIVEN
      const globalFn: RedFunctionAst = AstHelper.buildFunction(
        'GetPlayer',
        AstHelper.buildRef('PlayerPuppet'),
        true
      );

      // WHEN
      const code: string = fmt.formatCall(globalFn);

      // THEN
      expect(code).toBe('let player: ref<PlayerPuppet>;\n' +
        '\n' +
        'player = GetPlayer();\n');
    });

    it('should format static function', () => {
      // GIVEN
      const object: RedClassAst = AstHelper.buildClass('GameTime');
      const staticFn: RedFunctionAst = AstHelper.buildFunction(
        'IsAfter',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [AstHelper.buildArg('other', 'GameTime')]
      );

      // WHEN
      const code: string = fmt.formatCall(staticFn, object);

      // THEN
      expect(code).toBe('let other: GameTime;\n' +
        'let isAfter: Bool;\n' +
        '\n' +
        'isAfter = GameTime.IsAfter(other);\n');
    });

    it('should format static function and ignore full name', () => {
      // GIVEN
      const systemObj: RedClassAst = AstHelper.buildClass('gameVehicleSystem', 'VehicleSystem');
      const staticFn: RedFunctionAst = AstHelper.buildFunction(
        'IsPlayerInVehicle',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [AstHelper.buildArg('game', AstHelper.buildType('ScriptGameInstance', 'GameInstance'))],
        'gameVehicleSystem::IsPlayerInVehicle;GameInstance'
      );

      // WHEN
      const code: string = fmt.formatCall(staticFn, systemObj);

      // THEN
      expect(code).toBe('let game: GameInstance;\n' +
        'let isPlayerInVehicle: Bool;\n' +
        '\n' +
        'isPlayerInVehicle = VehicleSystem.IsPlayerInVehicle(game);\n');
    });

    it('should format member function', () => {
      // GIVEN
      const vehicleObj: RedClassAst = AstHelper.buildClass('vehicleBaseObject', 'VehicleObject');
      const memberFn: RedFunctionAst = AstHelper.buildFunction('HasNavPathToTarget',
        AstHelper.Bool,
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('targetID', AstHelper.buildType('entEntityID', 'EntityID')),
          AstHelper.buildArg('duration', AstHelper.Float),
          AstHelper.buildArg('invert', AstHelper.Bool)
        ]
      );

      // WHEN
      const code: string = fmt.formatCall(memberFn, vehicleObj);

      // THEN
      expect(code).toBe('let vehicleobject: VehicleObject;\n' +
        'let targetID: EntityID;\n' +
        'let duration: Float;\n' +
        'let invert: Bool;\n' +
        'let navPathToTarget: Bool;\n' +
        '\n' +
        'navPathToTarget = vehicleobject.HasNavPathToTarget(targetID, duration, invert);\n');
    });

    it('should format member function and ignore full name', () => {
      // GIVEN
      const vehicleObj: RedClassAst = AstHelper.buildClass('vehicleBaseObject', 'VehicleObject');
      const memberFn: RedFunctionAst = AstHelper.buildFunction('TriggerExitBehavior',
        undefined,
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('maxDelayOverride', AstHelper.Float, true),
        ],
        'TriggerExitBehavior;Float'
      );

      // WHEN
      const code: string = fmt.formatCall(memberFn, vehicleObj);

      // THEN
      expect(code).toBe('let vehicleobject: VehicleObject;\n' +
        'let maxDelayOverride: Float; // Optional\n' +
        '\n' +
        'vehicleobject.TriggerExitBehavior(maxDelayOverride);\n');
    });

    it('should format member function when name is only Get/Has/FindBy (#231)', () => {
      // GIVEN
      const vehicleObj: RedClassAst = AstHelper.buildClass('gameBlackboardSystem', 'BlackboardSystem');
      const memberFn: RedFunctionAst = AstHelper.buildFunction('Get',
        AstHelper.buildRef('gameIBlackboard', 'IBlackboard'),
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg(
            'definition',
            AstHelper.buildRef(
              'gamebbScriptDefinition',
              'BlackboardDefinition'
            )
          ),
        ],
        undefined,
        {isNative: true}
      );

      // WHEN
      const code: string = fmt.formatCall(memberFn, vehicleObj);

      // THEN
      expect(code).toBe('let blackboardsystem: BlackboardSystem;\n' +
        'let definition: ref<BlackboardDefinition>;\n' +
        'let result: ref<IBlackboard>;\n' +
        '\n' +
        'result = blackboardsystem.Get(definition);\n');
    });

    it('should format global function with an alias', () => {
      // GIVEN
      const gameInstanceObj: RedClassAst = AstHelper.buildClass('ScriptGameInstance', 'GameInstance');
      const globalFn: RedFunctionAst = AstHelper.buildFunction(
        'GetBlackboardSystem',
        AstHelper.buildRef('gameBlackboardSystem', 'BlackboardSystem'),
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('self', AstHelper.buildType('ScriptGameInstance', 'GameInstance'))
        ]
      );

      // WHEN
      const code: string = fmt.formatCall(globalFn, gameInstanceObj);

      // THEN
      expect(code).toBe('let self: GameInstance;\n' +
        'let blackboardSystem: ref<BlackboardSystem>;\n' +
        '\n' +
        'blackboardSystem = GameInstance.GetBlackboardSystem(self);\n');
    });

    it('should format member function without name conflicts', () => {
      // GIVEN
      const vehicleComponentObj: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const memberFn: RedFunctionAst = AstHelper.buildFunction('GetSeats',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('gi', AstHelper.buildType('ScriptGameInstance', 'GameInstance')),
          AstHelper.buildArg('vehicle',
            AstHelper.buildWeakRef('vehicleBaseObject', 'VehicleObject')
          ),
          AstHelper.buildArg('seats',
            AstHelper.buildArray(
              AstHelper.buildWeakRef('gamedataVehicleSeat_Record', 'VehicleSeat_Record')
            )
          )
        ]
      );

      // WHEN
      const code: string = fmt.formatCall(memberFn, vehicleComponentObj);

      // THEN
      expect(code).toEqual('let gi: GameInstance;\n' +
        'let vehicle: wref<VehicleObject>;\n' +
        'let seats: array<wref<VehicleSeat_Record>>;\n' +
        'let result: Bool;\n' +
        '\n' +
        'result = VehicleComponent.GetSeats(gi, vehicle, seats);\n');
    });
  });

  describe('formatPrototype()', () => {
    it('should format empty function', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction('ArraySortInts');

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('ArraySortInts() -> Void');
    });

    it('should format function with return type', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction('CanLog', AstHelper.Bool);

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('CanLog() -> Bool');
    });

    it('should format function with arguments and return type', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction(
        'Fake',
        AstHelper.buildArray(AstHelper.buildWeakRef('GameObject')),
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('a', AstHelper.Float, false, false, true),
          AstHelper.buildArg('b', AstHelper.buildStruct('Vector4'), false, true),
          AstHelper.buildArg('c', AstHelper.buildRef('WeaponObject'), true),
        ]
      );

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('Fake(const a: Float, out b: Vector4, opt c: ref<WeaponObject>) -> array<wref<GameObject>>');
    });
  });

  describe('formatSpecial(\'wrapMethod\')', () => {
    it('should not format native function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('ScriptGameInstance', 'GameInstance');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'FindEntityByID',
        undefined,
        true,
        RedVisibilityDef.public,
        [],
        undefined,
        {isNative: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('wrapMethod', func, memberOf);

      // THEN
      expect(code).toBe(``);
    });

    it('should format member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('PreventionSystem');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'GetLastAttackTime',
        AstHelper.Float,
        false,
        RedVisibilityDef.public,
        [],
        undefined,
        {isFinal: true, isConst: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('wrapMethod', func, memberOf);

      // THEN
      expect(code).toBe(`@wrapMethod(PreventionSystem)
public final const func GetLastAttackTime() -> Float {
    let result: Float = wrappedMethod();
\u0020\u0020\u0020\u0020
    return result;
}`);
    });

    it('should format static function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('PreventionSystem');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'QueueRequest',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('context', 'GameInstance'),
          AstHelper.buildArg('request', AstHelper.buildRef('ScriptableSystemRequest')),
          AstHelper.buildArg('delay', AstHelper.Float, true),
        ],
        undefined,
        {isFinal: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('wrapMethod', func, memberOf);

      // THEN
      expect(code).toBe(`@wrapMethod(PreventionSystem)
public final static func QueueRequest(context: GameInstance, request: ref<ScriptableSystemRequest>, opt delay: Float) -> Bool {
    let result: Bool = wrappedMethod(context, request, delay);
\u0020\u0020\u0020\u0020
    return result;
}`);
    });
  });

  describe('formatSpecial(\'replaceMethod\')', () => {
    it('should not format native function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('ScriptGameInstance', 'GameInstance');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'FindEntityByID',
        undefined,
        true,
        RedVisibilityDef.public,
        [],
        undefined,
        {isNative: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('replaceMethod', func, memberOf);

      // THEN
      expect(code).toBe(``);
    });

    it('should format member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('PreventionSystem');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'GetLastAttackTime',
        AstHelper.Float,
        false,
        RedVisibilityDef.public,
        [],
        undefined,
        {isFinal: true, isConst: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('replaceMethod', func, memberOf);

      // THEN
      expect(code).toBe(`@replaceMethod(PreventionSystem)
public final const func GetLastAttackTime() -> Float {
    let result: Float;
\u0020\u0020\u0020\u0020
    return result;
}`);
    });

    it('should format static function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('PreventionSystem');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'QueueRequest',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('context', 'GameInstance'),
          AstHelper.buildArg('request', AstHelper.buildRef('ScriptableSystemRequest')),
          AstHelper.buildArg('delay', AstHelper.Float, true),
        ],
        undefined,
        {isFinal: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('replaceMethod', func, memberOf);

      // THEN
      expect(code).toBe(`@replaceMethod(PreventionSystem)
public final static func QueueRequest(context: GameInstance, request: ref<ScriptableSystemRequest>, opt delay: Float) -> Bool {
    let result: Bool;
\u0020\u0020\u0020\u0020
    return result;
}`);
    });
  });

  describe('formatSpecial(\'replaceGlobal\')', () => {
    it('should not format native function', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction(
        'AngleDistance',
        AstHelper.Float,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('target', AstHelper.Float),
          AstHelper.buildArg('current', AstHelper.Float),
        ],
        undefined,
        {isNative: true}
      );

      // WHEN
      const code: string = fmt.formatSpecial('replaceGlobal', func);

      // THEN
      expect(code).toBe(``);
    });

    it('should format global function', () => {
      // GIVEN
      const func: RedFunctionAst = AstHelper.buildFunction(
        'GetFact',
        'Int32',
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('game', 'GameInstance'),
          AstHelper.buildArg('factName', 'CName'),
        ]
      );

      // WHEN
      const code: string = fmt.formatSpecial('replaceGlobal', func);

      // THEN
      expect(code).toBe(`@replaceGlobal()
public static func GetFact(game: GameInstance, factName: CName) -> Int32 {
    let result: Int32;
\u0020\u0020\u0020\u0020
    return result;
}`);
    });
  });
});
