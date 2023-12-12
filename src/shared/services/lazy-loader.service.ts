import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LazyLoaderService {

  /**
   * Load a stylesheet by its name.
   */
  public loadStylesheet(name: string): void {
    const $link: HTMLLinkElement = document.createElement('link');

    $link.rel = 'stylesheet';
    $link.href = `${name}.css`;
    document.head.appendChild($link);
  }

  /**
   * Load font as a stylesheet.
   */
  public loadFont(url: string): void {
    const $link: HTMLLinkElement = document.createElement('link');

    $link.rel = 'stylesheet';
    $link.href = url;
    document.head.appendChild($link);
  }

}
