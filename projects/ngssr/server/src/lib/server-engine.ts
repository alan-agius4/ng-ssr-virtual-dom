import Critters from 'critters';
import { JSDOM } from 'jsdom';
import { join, resolve } from 'path';
import * as fs from 'fs';
import { NgVirtualDomRenderMode, NgVirtualDomRenderModeAPI } from '@ngssr/server/browser';
import { CustomResourceLoader } from './custom-resource-loader';

export interface RenderOptions {
  headers?: Record<string, string | undefined | string[]>,
  url: {
    protocol: string;
    host: string;
    originalUrl: string;
  };
  inlineCriticalCss?: boolean;
  htmlFilename?: string;
  publicPath: string;
}
export class SSREngine {
  private readonly fileExistsCache = new Map<string, boolean>();
  private readonly htmlFileCache = new Map<string, string>();
  private readonly customResourceLoaderCache = new Map<string, Buffer>();

  async render(options: RenderOptions): Promise<string> {
    const prerenderedSnapshot = await this.getPrerenderedSnapshot(options);

    if (prerenderedSnapshot) {
      return prerenderedSnapshot;
    }

    const htmlContent = await this.getHtmlContent(options);

    const protocolAndHost = `${options.url.protocol}://${options.url.host}`;
    const fullUrl = `${protocolAndHost}${options.url.originalUrl}`;

    const customResourceLoader = new CustomResourceLoader(
      protocolAndHost,
      options.publicPath,
      this.customResourceLoaderCache
    );

    const dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously',
      resources: customResourceLoader,
      url: fullUrl,
      referrer: options.headers?.referrer as string | undefined,
      userAgent: options.headers?.['user-agent'] as string | undefined,
      beforeParse: window => {
        window.ngVirtualDomRenderMode = true
      },
    });

    const doc = dom.window.document;
    const ngVirtualDomRenderMode = await new Promise<NgVirtualDomRenderModeAPI>(resolve => {
      doc.addEventListener('DOMContentLoaded', () => {
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
      const script = doc.createElement('script');
      script.id = `${ngVirtualDomRenderMode.appId}-state`;
      script.setAttribute('type', 'application/json');
      script.textContent = state;
      doc.body.appendChild(script);
    }

    const content = dom.serialize();

    if (options.inlineCriticalCss === false) {
      return content;
    }

    const baseHref = doc.querySelector('base[href]')?.getAttribute('href') ?? '';
    const critters = new Critters({
      path: join(options.publicPath, baseHref),
      compress: true,
      pruneSource: false,
      reduceInlineStyles: false,
      mergeStylesheets: false,
      preload: 'media',
      noscriptFallback: true,
    });

    return critters.process(content);
  }

  private async getPrerenderedSnapshot({ publicPath, url }: RenderOptions): Promise<string | undefined> {
    // When hybrid rendering the 
    // Remove leading forward slash.
    const pagePath = resolve(publicPath, url.originalUrl.substring(1), 'index.html');

    if (await this.fileExists(pagePath)) {
      const content = await fs.promises.readFile(pagePath, 'utf-8');
      if (content.includes('ng-version=')) {
        // Page is pre-rendered
        return content;
      }
    }

    return undefined;
  }

  private async getHtmlContent({ publicPath, url, htmlFilename = 'index.html' }: RenderOptions): Promise<string> {
    const files = [
      join(publicPath, htmlFilename),
    ];

    const potentialLocalePath = url.originalUrl.split('/', 2)[1]; // potential base href
    if (potentialLocalePath) {
      files.push(join(publicPath, potentialLocalePath, htmlFilename));
    }

    for (const file of files) {
      if (this.htmlFileCache.has(file)) {
        return this.htmlFileCache.get(file)!;
      }

      if (await this.fileExists(file)) {
        const content = await fs.promises.readFile(file, 'utf-8');
        this.htmlFileCache.set(file, content);

        return content;
      }
    }

    throw new Error(`Cannot file HTML file. Looked in: ${files.join(', ')}`)
  }

  private async fileExists(path: string): Promise<boolean> {
    let fileExists = this.fileExistsCache.get(path);
    if (fileExists === undefined) {
      try {
        await fs.promises.access(path, fs.constants.F_OK);
        this.fileExistsCache.set(path, true);

        return true;
      } catch {

        this.fileExistsCache.set(path, false);
        return false;
      }
    }

    return fileExists;

  }
}
