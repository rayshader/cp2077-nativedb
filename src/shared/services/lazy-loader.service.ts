import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LazyLoaderService {

  /**
   * Load asset with its stylesheet.
   */
  public loadAsset(name: string): void {
    this.loadStyle(`${name}.css`);
  }

  /**
   * Attach a stylesheet to lazy-load from {@link url}.
   * @param url of asset to load.
   * @protected
   */
  protected loadStyle(url: string): void {
    const $link: HTMLLinkElement = document.createElement('link');

    $link.rel = 'stylesheet';
    $link.href = url;
    document.head.appendChild($link);
  }

}
