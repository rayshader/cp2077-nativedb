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
          AstHelper.buildArg('a', AstHelper.Float),
          AstHelper.buildArg('b', AstHelper.buildStruct('Vector4'), false, true),
          AstHelper.buildArg('c', AstHelper.buildRef('WeaponObject'), true),
        ]
      );

      // WHEN
      const code: string = fmt.formatPrototype(func);

      // THEN
      expect(code).toBe('Fake(a: Float, out b: Vector4, opt c: ref<WeaponObject>) -> array<wref<GameObject>>');
    });
  });

  describe('formatSpecial(\'Observe\')', () => {
    it('should format member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'PlayHonkForDuration',
        undefined,
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('honkTime', AstHelper.Float),
        ]
      );

      // WHEN
      const code: string = fmt.formatSpecial('Observe', func, memberOf);

      // THEN
      expect(code).toBe(`Observe("VehicleComponent", "PlayHonkForDuration",
---@param this VehicleComponent
---@param honkTime Float
function(this, honkTime)
    -- method has just been called
end)
`);
    });

    it('should format static function w/ fullname', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'OpenDoor',
        undefined,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('vehicle', AstHelper.buildWeakRef('vehicleBaseObject', 'VehicleObject')),
          AstHelper.buildArg('vehicleSlotID', AstHelper.buildType('gamemountingMountingSlotId', 'MountingSlotId')),
          AstHelper.buildArg('delay', AstHelper.Float, true),
        ],
        'OpenDoor;VehicleObjectMountingSlotIdFloat'
      );

      // WHEN
      const code: string = fmt.formatSpecial('Observe', func, memberOf);

      // THEN
      expect(code).toBe(`Observe("VehicleComponent", "OpenDoor;VehicleObjectMountingSlotIdFloat",
---@param vehicle VehicleObject
---@param vehicleSlotID MountingSlotId
---@param delay? Float
function(vehicle, vehicleSlotID, delay)
    -- method has just been called
end)
`);
    });
  });

  describe('formatSpecial(\'ObserveAfter\')', () => {
    it('should format member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'PlayHonkForDuration',
        undefined,
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('honkTime', AstHelper.Float),
        ]
      );

      // WHEN
      const code: string = fmt.formatSpecial('ObserveAfter', func, memberOf);

      // THEN
      expect(code).toBe(`ObserveAfter("VehicleComponent", "PlayHonkForDuration",
---@param this VehicleComponent
---@param honkTime Float
function(this, honkTime)
    -- method has been called and fully executed
end)
`);
    });

    it('should format static function w/ fullname', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'OpenDoor',
        undefined,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('vehicle', AstHelper.buildWeakRef('vehicleBaseObject', 'VehicleObject')),
          AstHelper.buildArg('vehicleSlotID', AstHelper.buildType('gamemountingMountingSlotId', 'MountingSlotId')),
          AstHelper.buildArg('delay', AstHelper.Float, true),
        ],
        'OpenDoor;VehicleObjectMountingSlotIdFloat'
      );

      // WHEN
      const code: string = fmt.formatSpecial('ObserveAfter', func, memberOf);

      // THEN
      expect(code).toBe(`ObserveAfter("VehicleComponent", "OpenDoor;VehicleObjectMountingSlotIdFloat",
---@param vehicle VehicleObject
---@param vehicleSlotID MountingSlotId
---@param delay? Float
function(vehicle, vehicleSlotID, delay)
    -- method has been called and fully executed
end)
`);
    });
  });

  describe('formatSpecial(\'Override\')', () => {
    it('should format member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'GetVehicle',
        AstHelper.buildWeakRef('vehicleBaseObject', 'VehicleObject')
      );

      // WHEN
      const code: string = fmt.formatSpecial('Override', func, memberOf);

      // THEN
      expect(code).toBe(`Override("VehicleComponent", "GetVehicle",
---@param this VehicleComponent
---@param wrappedMethod function
---@return VehicleObject
function(this, wrappedMethod)
    -- rewrite method
    local result = wrappedMethod()
\u0020\u0020\u0020\u0020
    return result
end)
`);
    });

    it('should format static function w/ fullname', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('VehicleComponent');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'CloseDoor',
        AstHelper.Bool,
        true,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('vehicle', AstHelper.buildWeakRef('vehicleBaseObject', 'VehicleObject')),
          AstHelper.buildArg('vehicleSlotID', AstHelper.buildType('gamemountingMountingSlotId', 'MountingSlotId')),
        ],
        'CloseDoor;VehicleObjectMountingSlotId'
      );

      // WHEN
      const code: string = fmt.formatSpecial('Override', func, memberOf);

      // THEN
      expect(code).toBe(`Override("VehicleComponent", "CloseDoor;VehicleObjectMountingSlotId",
---@param vehicle VehicleObject
---@param vehicleSlotID MountingSlotId
---@param wrappedMethod function
---@return Bool
function(vehicle, vehicleSlotID, wrappedMethod)
    -- rewrite method
    local result = wrappedMethod(vehicle, vehicleSlotID)
\u0020\u0020\u0020\u0020
    return result
end)
`);
    });
  });

  // Only with classes ending with Listener in name.
  describe('formatSpecial(\'NewProxy\')', () => {
    it('should format with member function', () => {
      // GIVEN
      const memberOf: RedClassAst = AstHelper.buildClass('GodModeStatListener');
      const func: RedFunctionAst = AstHelper.buildFunction(
        'OnGodModeChanged',
        undefined,
        false,
        RedVisibilityDef.public,
        [
          AstHelper.buildArg('ownerID', AstHelper.buildType('entEntityID', 'EntityID')),
          AstHelper.buildArg('newType', AstHelper.buildType('gameGodModeType')),
        ],
        'OnGodModeChanged;EntityIDgameGodModeType'
      );

      // WHEN
      const code: string = fmt.formatSpecial('NewProxy', func, memberOf);

      // THEN
      expect(code).toBe(`listener = NewProxy("GodModeStatListener", {
    OnGodModeChanged = {
        args = {"entEntityID", "gameGodModeType"},
        callback = function(ownerID, newType)
            -- do stuff
        end
    }
})
`);
    });
  });
});
