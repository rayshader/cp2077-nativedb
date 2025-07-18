import {computed, inject, Injectable, signal, Signal} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {TabItemNode} from "../../app/components/ndb-tabs/ndb-tabs.component";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeSyntax, SettingsService} from "./settings.service";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedOriginDef} from "../red-ast/red-definitions.ast";

export enum FilterBy {
  name,
  property,
  function,
  usage
}

export interface SearchRequest {
  readonly query: string;
  readonly filter: FilterBy;
  readonly strict: boolean;
}

interface Query {
  readonly filter: FilterBy;
  readonly fn: <T extends RedNodeAst>(nodes: T[], query: string, strict: boolean) => T[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly dumpService: RedDumpService = inject(RedDumpService);

  private readonly _query = signal<SearchRequest>({
    query: '',
    filter: FilterBy.name,
    strict: false
  });
  private readonly _changeQuery = signal<SearchRequest>({
    query: '',
    filter: FilterBy.name,
    strict: false
  });

  readonly enums = computed<TabItemNode[]>(() => this.toItemNode(this.dumpService.enums));
  readonly bitfields = computed<TabItemNode[]>(() => this.toItemNode(this.dumpService.bitfields));
  readonly classes = computed<TabItemNode[]>(() => this.toItemNode(this.dumpService.classes));
  readonly structs = computed<TabItemNode[]>(() => this.toItemNode(this.dumpService.structs));
  readonly functions = computed<TabItemNode[]>(() => this.toItemNode(this.dumpService.functions));

  readonly query: Signal<SearchRequest> = this._query;
  readonly changeQuery: Signal<SearchRequest> = this._changeQuery;

  private readonly queries: Query[] = [
    {filter: FilterBy.name, fn: this.filterByName.bind(this)},
    {filter: FilterBy.property, fn: this.filterByProperty.bind(this)},
    {filter: FilterBy.function, fn: this.filterByFunction.bind(this)},
    {filter: FilterBy.usage, fn: this.filterByUsage.bind(this)},
  ];

  public static isPropertyOrUsage(request: SearchRequest) {
    return request.query.length > 0 && (request.filter === FilterBy.property || request.filter === FilterBy.usage);
  }

  public static isFunctionOrUsage(request: SearchRequest) {
    return request.query.length > 0 && (request.filter === FilterBy.function || request.filter === FilterBy.usage);
  }

  public static filterProperties(properties: RedPropertyAst[], request: SearchRequest): RedPropertyAst[] {
    const query: string = request.query.toLowerCase();
    const words: string[] = query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    if (request.filter === FilterBy.usage) {
      if (rule) {
        return properties.filter((prop) => RedPropertyAst.testByUsage(prop, rule));
      } else if (request.strict) {
        return properties.filter((prop) => RedPropertyAst.filterByStrictUsage(prop, query));
      } else {
        return properties.filter((prop) => RedPropertyAst.filterByUsage(prop, words));
      }
    }
    if (rule) {
      return properties.filter((prop) => RedNodeAst.testName(prop, rule));
    } else if (request.strict) {
      return properties.filter((prop) => RedNodeAst.hasStrictName(prop, query));
    } else {
      return properties.filter((prop) => RedNodeAst.hasName(prop, words));
    }
  }

  public static filterFunctions<T>(functions: T[],
                                   request: SearchRequest,
                                   key?: (data: T) => RedFunctionAst): T[] {
    const query: string = request.query.toLowerCase();
    const words: string[] = query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    key ??= (data) => data as RedFunctionAst;
    if (request.filter === FilterBy.usage) {
      if (rule) {
        return functions.filter((func) => RedFunctionAst.testByUsage(key(func), rule));
      } else if (request.strict) {
        return functions.filter((func) => RedFunctionAst.filterByStrictUsage(key(func), query));
      } else {
        return functions.filter((func) => RedFunctionAst.filterByUsage(key(func), words));
      }
    }
    if (rule) {
      return functions.filter((func) => RedNodeAst.testName(key(func), rule));
    } else if (request.strict) {
      return functions.filter((func) => RedNodeAst.hasStrictName(key(func), query));
    } else {
      return functions.filter((func) => RedNodeAst.hasName(key(func), words));
    }
  }

  search(query: string, filter: FilterBy, strict: boolean): void {
    this._query.set({query: query, filter: filter, strict: strict});
  }

  requestSearch(query: string, filter: FilterBy, strict: boolean): void {
    this._changeQuery.set({query: query, filter: filter, strict: strict});
  }

  private toItemNode(storage: Signal<RedNodeAst[]>): TabItemNode[] {
    let nodes = storage();

    const scriptOnly = this.settingsService.scriptOnly();
    if (scriptOnly) {
      nodes = nodes.filter((node) => {
        if (node.kind !== RedNodeKind.class && node.kind !== RedNodeKind.struct) {
          return true;
        }
        const object: RedClassAst = node as unknown as RedClassAst;

        return object.origin === RedOriginDef.script;
      });
    }

    const request: SearchRequest = this.query();
    if (request.query.length !== 0) {
      const query: Query | undefined = this.queries.find((item) => item.filter === request.filter);
      if (query) {
        nodes = query.fn(nodes, request.query, request.strict);
      }
    }

    const highlightEmptyObject = this.settingsService.highlightEmptyObject();
    const syntax = this.settingsService.code();
    return nodes.map((node) => {
      const isEmpty: boolean = RedNodeAst.isEmpty(node);
      const name: string = (syntax === CodeSyntax.redscript && node.aliasName) ? node.aliasName : node.name;

      return <TabItemNode>{
        id: node.id,
        uri: `/${RedNodeKind[node.kind][0]}/${node.id}`,
        name: name,
        isEmpty: highlightEmptyObject && isEmpty,
      };
    })
  }

  private filterByName<T extends RedNodeAst>(nodes: T[], query: string, strict: boolean): T[] {
    query = query.toLowerCase();
    const words: string[] = query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    return nodes.filter((node) => {
      const name: string = node.name.toLowerCase();
      const aliasName: string | undefined = node.aliasName?.toLowerCase();

      if (rule) {
        return rule.test(name) || (!!aliasName && rule.test(aliasName));
      } else if (strict) {
        return name === query || (!!aliasName && aliasName === query);
      } else {
        return words.every((word) => name.includes(word)) ||
          (!!aliasName && words.every((word) => aliasName.includes(word)));
      }
    });
  }

  private filterByProperty<T extends RedNodeAst>(nodes: T[], query: string, strict: boolean): T[] {
    query = query.toLowerCase();
    const words: string[] = query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield || node.kind === RedNodeKind.function) {
        return false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      let properties: RedPropertyAst[] = object.properties;

      if (rule) {
        properties = properties.filter((prop) => RedNodeAst.testName(prop, rule));
      } else if (strict) {
        properties = properties.filter((prop) => RedNodeAst.hasStrictName(prop, query));
      } else {
        properties = properties.filter((prop) => RedNodeAst.hasName(prop, words));
      }
      return properties.length > 0;
    });
  }

  private filterByFunction<T extends RedNodeAst>(nodes: T[], query: string, strict: boolean): T[] {
    query = query.toLowerCase();
    const words: string[] = strict ? [query] : query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield || node.kind === RedNodeKind.function) {
        return false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      let functions: RedFunctionAst[] = object.functions;

      if (rule) {
        functions = functions.filter((func) => RedNodeAst.testName(func, rule));
      } else if (strict) {
        functions = functions.filter((func) => RedNodeAst.hasStrictName(func, query));
      } else {
        functions = functions.filter((func) => RedNodeAst.hasName(func, words));
      }
      return functions.length > 0;
    });
  }

  private filterByUsage<T extends RedNodeAst>(nodes: T[], query: string, strict: boolean): T[] {
    query = query.toLowerCase();
    const words: string[] = strict ? [query] : query.split(' ');
    const rule: RegExp | undefined = SearchService.createRule(query);

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield) {
        return false;
      }
      if (node.kind === RedNodeKind.function) {
        if (rule) {
          return RedFunctionAst.testByUsage(node as unknown as RedFunctionAst, rule);
        } else if (strict) {
          return RedFunctionAst.filterByStrictUsage(node as unknown as RedFunctionAst, query);
        } else {
          return RedFunctionAst.filterByUsage(node as unknown as RedFunctionAst, words);
        }
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      let properties: RedPropertyAst[] = object.properties;
      let functions: RedFunctionAst[] = object.functions;

      if (rule) {
        properties = properties.filter((prop) => RedPropertyAst.testByUsage(prop, rule));
        functions = functions.filter((func) => RedFunctionAst.testByUsage(func, rule));
      } else if (strict) {
        properties = properties.filter((prop) => RedPropertyAst.filterByStrictUsage(prop, query));
        functions = functions.filter((func) => RedFunctionAst.filterByStrictUsage(func, query));
      } else {
        properties = properties.filter((prop) => RedPropertyAst.filterByUsage(prop, words));
        functions = functions.filter((func) => RedFunctionAst.filterByUsage(func, words));
      }

      return properties.length > 0 || functions.length > 0;
    });
  }

  private static createRule(query: string): RegExp | undefined {
    const rule: string = query.replaceAll('*', '.*');

    return query.includes('*') ? RegExp(`^${rule}$`) : undefined;
  }

}
