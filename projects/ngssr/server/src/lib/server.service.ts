import Critters from 'critters';
import { JSDOM } from 'jsdom';
import { join, posix } from 'path';
import { NgVirtualDomRenderMode, NgVirtualDomRenderModeAPI } from '@ngssr/server/browser';
import { CustomResourceLoader } from './custom-resource-loader';

export interface RenderOptions {
  referrer?: string;
  urlPath: string;
  inlineCriticalCss?: boolean;
}

export interface ServiceOptions {
  htmlFilePath?: string;
  publicPath: string;
  baseUrl: string;
}

export class SSRService {
  private readonly customResourceLoader: CustomResourceLoader;
  private readonly critters: Critters;

  constructor(private readonly options: ServiceOptions) {
    this.customResourceLoader = new CustomResourceLoader(this.options.baseUrl, this.options.publicPath);
    this.critters = new Critters({
      path: this.options.publicPath,
      publicPath: this.options.baseUrl,
      compress: true,
      pruneSource: false,
      reduceInlineStyles: false,
      mergeStylesheets: false,
      preload: 'media',
      noscriptFallback: true,
    })
  }

  async render(options: RenderOptions): Promise<string> {
    const file = join(this.options.publicPath, this.options.htmlFilePath ?? 'index.html');
    const dom = await JSDOM.fromFile(file, {
      runScripts: 'dangerously',
      resources: this.customResourceLoader,
      url: posix.join(this.options.baseUrl, options.urlPath),
      referrer: options.referrer,
      beforeParse: window => {
        window.ngVirtualDomRenderMode = true
      },
    });

    const ngVirtualDomRenderMode = await new Promise<NgVirtualDomRenderModeAPI>(resolve => {
      dom.window.document.addEventListener('DOMContentLoaded', () => {
        const interval = setInterval(() => {
          const ngVirtualDomRenderMode = dom.window.ngVirtualDomRenderMode as NgVirtualDomRenderMode;
          if (ngVirtualDomRenderMode && typeof ngVirtualDomRenderMode === 'object') {
            // Wait until up is stable or limit reached.
            clearInterval(interval);
            resolve(ngVirtualDomRenderMode);
          }
        }, 50);
      });
    });

    await ngVirtualDomRenderMode.getWhenStable();

    // Add Angular state
    const state = ngVirtualDomRenderMode.getSerializedState();
    if (state) {
      const doc = dom.window.document;
      const script = doc.createElement('script');
      script.id = `${ngVirtualDomRenderMode.appId}-state`;
      script.setAttribute('type', 'application/json');
      script.textContent = state;
      doc.body.appendChild(script);
    }

    const content = dom.serialize();

    return options.inlineCriticalCss === false
      ? content
      : this.critters.process(content);
  }
}
