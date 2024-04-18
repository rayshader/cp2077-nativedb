import {CodeFormatter} from "./formatter";
import {LuaFormatter} from "./lua.formatter";
import {AstHelper} from "../../../tests/ast.helper";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedVisibilityDef} from "../red-ast/red-definitions.ast";
import {RedClassAst} from "../red-ast/red-class.ast";

describe('LuaFormatter', () => {
  let fmt: CodeFormatter;

  beforeAll(() => {
    fmt = new LuaFormatter();
  });

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
    expect(code).toBe('local player -- ref<PlayerPuppet>\n' +
      '\n' +
      'player = Game.GetPlayer()\n');
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
    expect(code).toBe('local other -- GameTime\n' +
      'local isAfter -- Bool\n' +
      '\n' +
      'isAfter = GameTime.IsAfter(other)\n');
  });

  it('should format static function and ignore full name', () => {
    // GIVEN
    const systemObj: RedClassAst = AstHelper.buildClass('gameVehicleSystem', 'VehicleSystem');
    const staticFn: RedFunctionAst = AstHelper.buildFunction(
      'IsPlayerInVehicle',
      AstHelper.Bool,
      true,
      RedVisibilityDef.public,
      [AstHelper.buildArg('game', 'ScriptGameInstance')],
      'gameVehicleSystem::IsPlayerInVehicle;GameInstance'
    );

    // WHEN
    const code: string = fmt.formatCall(staticFn, systemObj);

    // THEN
    expect(code).toBe('local game -- ScriptGameInstance\n' +
      'local isPlayerInVehicle -- Bool\n' +
      '\n' +
      'isPlayerInVehicle = VehicleSystem.IsPlayerInVehicle(game)\n');
  });

  it('should format member function', () => {
    // GIVEN
    const vehicleObj: RedClassAst = AstHelper.buildClass('vehicleBaseObject', 'VehicleObject');
    const memberFn: RedFunctionAst = AstHelper.buildFunction('HasNavPathToTarget',
      AstHelper.Bool,
      false,
      RedVisibilityDef.public,
      [
        AstHelper.buildArg('targetID', 'entEntityID'),
        AstHelper.buildArg('duration', AstHelper.Float),
        AstHelper.buildArg('invert', AstHelper.Bool)
      ]
    );

    // WHEN
    const code: string = fmt.formatCall(memberFn, vehicleObj);

    // THEN
    expect(code).toBe('local vehicleobject -- VehicleObject\n' +
      'local targetID -- entEntityID\n' +
      'local duration -- Float\n' +
      'local invert -- Bool\n' +
      'local navPathToTarget -- Bool\n' +
      '\n' +
      'navPathToTarget = vehicleobject:HasNavPathToTarget(targetID, duration, invert)\n');
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
    expect(code).toBe('local vehicleobject -- VehicleObject\n' +
      'local maxDelayOverride -- Float, optional\n' +
      '\n' +
      'vehicleobject:TriggerExitBehavior(maxDelayOverride)\n');
  });

  it('should format global function with an alias', () => {
    // GIVEN
    const gameInstanceObj: RedClassAst = AstHelper.buildClass('ScriptGameInstance', 'GameInstance');
    const globalFn: RedFunctionAst = AstHelper.buildFunction(
      'GetBlackboardSystem',
      AstHelper.buildRef('gameBlackboardSystem', 'BlackboardSystem'),
      true
    );

    // WHEN
    const code: string = fmt.formatCall(globalFn, gameInstanceObj);

    // THEN
    expect(code).toBe('local blackboardSystem -- ref<BlackboardSystem>\n' +
      '\n' +
      'blackboardSystem = Game.GetBlackboardSystem()\n');
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
    expect(code).toEqual('local gi -- GameInstance\n' +
      'local vehicle -- wref<VehicleObject>\n' +
      'local seats -- array<wref<VehicleSeat_Record>>\n' +
      'local result -- Bool\n' +
      '\n' +
      'result = VehicleComponent.GetSeats(gi, vehicle, seats)\n');
  });

});
