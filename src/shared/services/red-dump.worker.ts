import {RedEnumAst} from "../red-ast/red-enum.ast";
import {NDBCommand, NDBCommandHandler, NDBMessage} from "../worker.common";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedDumpWorkerLoad, RedDumpWorkerLoadAliases} from "./red-dump.service";
import {InheritData} from "../../app/pages/object/object.component";

interface RedDumpData {
  enums: RedEnumAst[];
  bitfields: RedBitfieldAst[];
  functions: RedFunctionAst[];
  objects: RedClassAst[];
  classes: RedClassAst[];
  structs: RedClassAst[];
}

const data: RedDumpData = {
  enums: [],
  bitfields: [],
  functions: [],
  objects: [],
  classes: [],
  structs: []
};

(async () => {
  addEventListener('message', onMessage);

  data.enums = await loadEnums();
  data.bitfields = await loadBitfields();
  data.functions = await loadFunctions();
  data.objects = await loadObjects();
  const nodes: RedNodeAst[] = [...data.enums, ...data.bitfields, ...data.functions, ...data.objects];

  data.classes = data.objects.filter((object) => !object.isStruct);
  data.structs = data.objects.filter((object) => object.isStruct);
  const badges: number = computeBadges(data.objects);

  send(NDBCommand.rd_load, <RedDumpWorkerLoad>{
    enums: data.enums,
    bitfields: data.bitfields,
    functions: data.functions,
    classes: data.classes,
    structs: data.structs,
    badges: badges
  });

  loadAliases(nodes);

  send(NDBCommand.rd_load_aliases, <RedDumpWorkerLoadAliases>{
    functions: data.functions,
    classes: data.classes,
    structs: data.structs
  });
})();

const commands: NDBCommandHandler[] = [
  {command: NDBCommand.rd_load_inheritance, fn: onLoadInheritance}
];

function onMessage(event: MessageEvent): void {
  const message: NDBMessage = event.data as NDBMessage;
  const handler: NDBCommandHandler | undefined = commands.find((item) => item.command === message.command);

  if (!handler) {
    console.warn('RedDumpWorker: unknown command.');
    return;
  }
  handler.fn(message.data);
}

function onLoadInheritance(id: number): void {
  const object: RedClassAst | undefined = data.objects.find((object) => object.id === id);

  if (!object) {
    return;
  }
  if (object.isInheritanceLoaded) {
    return;
  }
  loadParents(data.objects, object);
  loadChildren(data.objects, object);
  object.isInheritanceLoaded = true;
  send(NDBCommand.rd_load_inheritance, [object.id, object.parents, object.children]);
}

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
  const json: any[] = await getJson('./assets/reddump/enums.json');
  const enums: RedEnumAst[] = json.map(RedEnumAst.fromJson);

  enums.sort(RedEnumAst.sort);
  return enums;
}

async function loadBitfields(): Promise<RedBitfieldAst[]> {
  const json: any[] = await getJson('./assets/reddump/bitfields.json');
  const bitfields: RedBitfieldAst[] = json.map(RedBitfieldAst.fromJson);

  bitfields.sort(RedBitfieldAst.sort);
  return bitfields;
}

async function loadFunctions(): Promise<RedFunctionAst[]> {
  const json: any[] = await getJson('./assets/reddump/globals.json');
  const functions: RedFunctionAst[] = json.map(RedFunctionAst.fromJson);

  functions.sort(RedFunctionAst.sort);
  return functions;
}

async function loadObjects(): Promise<RedClassAst[]> {
  const json: any[] = await getJson('./assets/reddump/classes.json');
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
