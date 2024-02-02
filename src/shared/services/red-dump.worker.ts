import {RedEnumAst} from "../red-ast/red-enum.ast";
import {NDBCommand, NDBMessage} from "../worker.common";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedDumpWorkerLoad, RedDumpWorkerUpdate} from "./red-dump.service";
import {InheritData} from "../../app/pages/object/object.component";

(async () => {
  const enums: RedEnumAst[] = await loadEnums();
  const bitfields: RedBitfieldAst[] = await loadBitfields();
  const functions: RedFunctionAst[] = await loadFunctions();
  const objects: RedClassAst[] = await loadObjects();
  const nodes: RedNodeAst[] = [...enums, ...bitfields, ...functions, ...objects];

  const classes: RedClassAst[] = objects.filter((object) => !object.isStruct);
  const structs: RedClassAst[] = objects.filter((object) => object.isStruct);
  const badges: number = computeBadges(objects);

  send(NDBCommand.rd_load, <RedDumpWorkerLoad>{
    enums,
    bitfields,
    functions,
    classes,
    structs,
    badges
  });

  loadAliases(nodes);

  send(NDBCommand.rd_update, <RedDumpWorkerUpdate>{
    functions,
    classes,
    structs
  });

  loadInheritance(objects);

  send(NDBCommand.rd_update, <RedDumpWorkerUpdate>{
    classes,
    structs
  });

  send(NDBCommand.dispose);
})();

function send(command: NDBCommand, data?: any): void {
  postMessage(<NDBMessage>{
    command: command,
    data: data
  });
}

function computeBadges(objects: RedClassAst[]): number {
  return objects.map((object) => {
    const props = object.properties.map(RedPropertyAst.computeBadges).reduce(getMax, 1);
    const funcs = object.functions.map(RedFunctionAst.computeBadges).reduce(getMax, 1);

    return Math.max(props, funcs);
  }).reduce(getMax);
}

function getMax(a: number, b: number): number {
  return Math.max(a, b);
}

function loadInheritance(objects: RedClassAst[]): void {
  objects.forEach((object) => {
    loadParents(objects, object);
    loadChildren(objects, object);
  });
}

function loadParents(objects: RedClassAst[], object: RedClassAst): void {
  let parent = objects.find((item) => item.name === object.parent);

  if (parent) {
    object.parents.push(<InheritData>{
      id: parent.id,
      kind: parent.kind,
      name: parent.name,
      aliasName: parent.aliasName,
      isEmpty: RedNodeAst.isEmpty(parent),
      size: -1
    });
  }
  while (parent && parent.parent) {
    parent = objects.find((item) => item.name === parent!.parent);
    if (parent) {
      object.parents.push(<InheritData>{
        id: parent.id,
        kind: parent.kind,
        name: parent.name,
        aliasName: parent.aliasName,
        isEmpty: RedNodeAst.isEmpty(parent),
        size: -1
      });
    }
  }
}

function loadChildren(objects: RedClassAst[], object: RedClassAst): void {
  objects
    .filter((child) => child.parent === object.name)
    .forEach((child) => object.children.push(<InheritData>{
      id: child.id,
      kind: child.kind,
      name: child.name,
      aliasName: child.aliasName,
      isEmpty: RedNodeAst.isEmpty(child),
      size: -1
    }));
}

function loadAliases(nodes: RedNodeAst[]): void {
  const aliases: RedNodeAst[] = nodes.filter((node) => node.aliasName);

  nodes
    .filter((node) => node.kind !== RedNodeKind.enum && node.kind !== RedNodeKind.bitfield)
    .forEach((node) => {
      if (node.kind === RedNodeKind.class || node.kind === RedNodeKind.struct) {
        RedClassAst.loadAliases(aliases, node as RedClassAst);
      } else if (node.kind === RedNodeKind.function) {
        RedFunctionAst.loadAlias(aliases, node as RedFunctionAst);
      }
    });
}

async function loadEnums(): Promise<RedEnumAst[]> {
  const json: any[] = await getJson('/assets/reddump/enums.json');
  const enums: RedEnumAst[] = json.map(RedEnumAst.fromJson);

  enums.sort(RedEnumAst.sort);
  return enums;
}

async function loadBitfields(): Promise<RedBitfieldAst[]> {
  const json: any[] = await getJson('/assets/reddump/bitfields.json');
  const bitfields: RedBitfieldAst[] = json.map(RedBitfieldAst.fromJson);

  bitfields.sort(RedBitfieldAst.sort);
  return bitfields;
}

async function loadFunctions(): Promise<RedFunctionAst[]> {
  const json: any[] = await getJson('/assets/reddump/globals.json');
  const functions: RedFunctionAst[] = json.map(RedFunctionAst.fromJson);

  functions.sort(RedFunctionAst.sort);
  return functions;
}

async function loadObjects(): Promise<RedClassAst[]> {
  const json: any[] = await getJson('/assets/reddump/classes.json');
  const objects: RedClassAst[] = json.map(RedClassAst.fromJson);

  objects.sort(RedClassAst.sort);
  objects.forEach((object) => {
    object.properties.sort(RedPropertyAst.sort);
    object.functions.sort(RedFunctionAst.sort);
  });
  return objects;
}

async function getJson(url: string): Promise<any> {
  const res: Response = await fetch(url);

  return await res.json();
}
