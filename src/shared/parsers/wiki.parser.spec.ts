import {WikiParser, WikiParserError, WikiParserErrorCode} from "./wiki.parser";
import {WikiClassDto} from "../dtos/wiki.dto";
import {cyrb53} from "../string";

describe('WikiParser', () => {
  let parser: WikiParser;

  beforeAll(() => {
    parser = new WikiParser();
  });

  describe('parseClass(<file>, \'ScriptGameInstance\')', () => {
    it('should throw a WikiParserError when there is no title', () => {
      // GIVEN
      const wikiFile: any = {
        className: 'scriptgameinstance',
        fileName: 'scriptgameinstance.md',
        markdown: `## Description

Testing WikiClient with struct ScriptGameInstance.`
      };

      // WHEN
      const parse = () => parser.parseClass(wikiFile, 'ScriptGameInstance');

      // THEN
      expect(parse).toThrow(new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noTitle));
    });

    it('should throw a WikiParserError when there is no content', () => {
      // GIVEN
      const wikiFile: any = {
        className: 'scriptgameinstance',
        fileName: 'scriptgameinstance.md',
        markdown: '# ScriptGameInstance'
      };

      // WHEN
      const parse = () => parser.parseClass(wikiFile, 'ScriptGameInstance');

      // THEN
      expect(parse).toThrow(new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noContent));
    });

    it('should parse class description only', () => {
      // GIVEN
      const wikiFile: any = {
        sha: '',
        className: 'scriptgameinstance',
        fileName: 'scriptgameinstance.md',
        markdown: `# ScriptGameInstance

## Description

A simple phrase. A reference to struct \\[Vector4]. Some block \`style\`.

{% hint style="info" %}
A hint, block is ignored.
{% endhint %}

> A quote, block is ignored.

\`\`\`lua
-- Code w/ lua, block is ignored.
\`\`\`

Support escape sequences like:
\\!\\"\\#\\$\\%\\&\\'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\_\\{\\|\\}\\~\\\`

A new paragraph. An URL [link](https://cyberpunk.net). A list:

* Item A
* Item B

1. Item C
2. Item D

* [ ] Task E
* [ ] Task F`
      };

      // WHEN
      const wikiClass: WikiClassDto = parser.parseClass(wikiFile, 'ScriptGameInstance');

      // THEN
      expect(wikiClass).toEqual(expect.objectContaining<WikiClassDto>({
        id: cyrb53('ScriptGameInstance'),
        sha: '',
        name: 'ScriptGameInstance',
        comment: `A simple phrase. A reference to struct [Vector4]. Some block \`style\`.

Support escape sequences like:
!"#$%&'()*+,-./:;<=>?@[\\]^_{|}~\`

A new paragraph. An URL [link](https://cyberpunk.net). A list:

- Item A
- Item B

- Item C
- Item D

- Task E
- Task F`,
        functions: []
      }));
    });

    it('should parse class functions only', () => {
      // GIVEN
      const wikiFile: any = {
        sha: '',
        className: 'scriptgameinstance',
        fileName: 'scriptgameinstance.md',
        markdown: `# ScriptGameInstance

## Functions

#### FindEntityByID(self: ScriptGameInstance, entityId: entEntityID) -> handle:entEntity

A simple phrase. A reference to struct \\[Vector4]. Some block \`style\`.

{% hint style="info" %}
A hint, block is ignored.
{% endhint %}

#### FindWaypointsByTag(self: ScriptGameInstance, tag: CName, out waypoints: array:Vector4) -> Void

> A quote, block is ignored.

\`\`\`lua
-- Code w/ lua, block is ignored.
\`\`\`

A new paragraph. An URL [link](https://cyberpunk.net). A list:

#### SetDestructionGridPointValues(layer: Uint32, values: \\[15]Float, accumulate: Bool) -> Void

* Item A
* Item B

1. Item C
2. Item D

* [ ] Task E
* [ ] Task F`
      };

      // WHEN
      const wikiClass: WikiClassDto = parser.parseClass(wikiFile, 'ScriptGameInstance');

      // THEN
      expect(wikiClass).toEqual(expect.objectContaining({
        id: cyrb53('ScriptGameInstance'),
        sha: '',
        name: 'ScriptGameInstance',
        comment: '',
        functions: expect.arrayContaining([
          {
            id: cyrb53('FindEntityByIDself,entityIdref<entEntity>'),
            name: 'FindEntityByID',
            comment: 'A simple phrase. A reference to struct [Vector4]. Some block \`style\`.'
          },
          {
            id: cyrb53('FindWaypointsByTagself,tag,waypointsVoid'),
            name: 'FindWaypointsByTag',
            comment: 'A new paragraph. An URL [link](https://cyberpunk.net). A list:'
          },
          {
            id: cyrb53('SetDestructionGridPointValueslayer,values,accumulateVoid'),
            name: 'SetDestructionGridPointValues',
            comment: '- Item A\n- Item B\n\n- Item C\n- Item D\n\n- Task E\n- Task F'
          },
        ])
      }));
    });
  });

});