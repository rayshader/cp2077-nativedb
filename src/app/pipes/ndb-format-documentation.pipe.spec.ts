import {NDBFormatDocumentationPipe} from "./ndb-format-documentation.pipe";
import {TestBed} from "@angular/core/testing";
import {SafeHtml} from "@angular/platform-browser";
import {BrowserTestingModule} from "@angular/platform-browser/testing";
import {cyrb53} from "../../shared/string";
import {mockLocation} from "../../../tests/window.mock";

describe('NDBFormatDocumentationPipe', () => {
  let pipe: NDBFormatDocumentationPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserTestingModule
      ],
      providers: [
        NDBFormatDocumentationPipe
      ]
    });
    pipe = TestBed.inject(NDBFormatDocumentationPipe);
  });

  function getSafeHtml(html: SafeHtml): string {
    // @ts-ignore
    return html.changingThisBreaksApplicationSecurity;
  }

  it('should replace all \\n with <br>', () => {
    // GIVEN
    const documentation: string = 'This is a multiline\n' +
      'paragraph which needs formatting with HTML tags.\n';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    expect(html).toBe('This is a multiline<br>' +
      'paragraph which needs formatting with HTML tags.<br>');
  });

  it('should format [Bool] with IDE style', () => {
    // GIVEN
    const documentation: string = 'This test should be true thanks to [Bool] type.';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    expect(html).toBe('This test should be true thanks to <span class="stx-primitive-type">Bool</span> type.');
  });

  it('should format [Awesome] with an anchor', () => {
    // GIVEN
    const documentation: string = 'This test should link my [Awesome] type.';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    expect(html).toBe('This test should link my ' +
      '<a class="stx-type" title="Navigate to Awesome" data-route="/Awesome" data-name="only">Awesome</a>' +
      ' type.');
  });

  it('should format [this.IsValid] with a relative anchor and a fragment', () => {
    // GIVEN
    const documentation: string = 'This test should link my relative [this.IsValid] member.';

    mockLocation('/Test');

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    const uri: string = `/Test#${cyrb53('IsValid')}`;

    expect(html).toBe('This test should link my relative ' +
      `<a class="stx-type" title="Navigate to IsValid" data-route="${uri}">IsValid</a>` +
      ' member.');
  });

  it('should format [World.Teleport] with an anchor and a fragment', () => {
    // GIVEN
    const documentation: string = 'This test should link [World.Teleport] to somewhere else.';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    const uri: string = `/World#${cyrb53('Teleport')}`;

    expect(html).toBe('This test should link ' +
      `<a class="stx-type" title="Navigate to Teleport of World" data-route="${uri}">World.Teleport</a>` +
      ' to somewhere else.');
  });

  it('should format [title](url) with an anchor and a title', () => {
    // GIVEN
    const documentation: string = 'This test should format my [link](https://www.somewhere.com).';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    expect(html).toBe('This test should format my ' +
      `<a class="stx-lang" href="https://www.somewhere.com" target="_blank">link</a>` +
      '.');
  });

  it('should format `content` with <pre> tag', () => {
    // GIVEN
    const documentation: string = 'This test should format my `magic content` and ```code content```.';

    // WHEN
    const html: string = getSafeHtml(pipe.transform(documentation));

    // THEN
    expect(html).toBe('This test should format my ' +
      `<pre>magic content</pre> and <pre>code content</pre>.`);
  });

});
