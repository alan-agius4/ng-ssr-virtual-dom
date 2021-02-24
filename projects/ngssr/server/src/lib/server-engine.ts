import Critters from 'critters';
import { JSDOM } from 'jsdom';
import { join, resolve } from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import { NgVirtualDomRenderMode, NgVirtualDomRenderModeAPI } from '@ngssr/server/browser';
import { CustomResourceLoader } from './custom-resource-loader';
import { InlineCriticalCssProcessor } from './inline-css-processor';

export interface RenderOptions {
  headers?: Record<string, string | undefined | string[]>,
  url: string;
  inlineCriticalCss?: boolean;
  htmlFilename?: string;
  publicPath: string;
}
export class SSREngine {
  private readonly fileExistsCache = new Map<string, boolean>();
  private readonly htmlFileCache = new Map<string, string>();
  private readonly resourceLoaderCache = new Map<string, Buffer>();
  private readonly inlineCriticalCssProcessor = new InlineCriticalCssProcessor(
    { minify: true },
    this.resourceLoaderCache,
  );

  async render(options: RenderOptions): Promise<string> {
    console.time('Render');

    const { pathname, origin } = new URL(options.url);
    const prerenderedSnapshot = await this.getPrerenderedSnapshot(options.publicPath, pathname);

    if (prerenderedSnapshot) {
      return prerenderedSnapshot;
    }

    const htmlContent = await this.getHtmlTemplate(options.publicPath, pathname, options.htmlFilename);

    const customResourceLoader = new CustomResourceLoader(
      origin,
      options.publicPath,
      this.resourceLoaderCache
    );

    const dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously',
      resources: customResourceLoader,
      url: options.url,
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
        }, 30);
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
      console.timeEnd('Render');
      return content;
    }

    const baseHref = doc.querySelector('base[href]')?.getAttribute('href') ?? '';
    const { content: contentWithInlineCSS, warnings, errors } = await this.inlineCriticalCssProcessor.process(content, {
      outputPath: join(options.publicPath, baseHref),
    })

    warnings.forEach(m => console.warn(m));
    errors.forEach(m => console.error(m));

    console.timeEnd('Render');
    return contentWithInlineCSS;
  }

  private async getPrerenderedSnapshot(publicPath: string, pathname: string): Promise<string | undefined> {
    // When hybrid rendering the 
    // Remove leading forward slash.
    const pagePath = resolve(publicPath, pathname.substring(1), 'index.html');

    const content = await this.readHTMLFile(pagePath);
    return content?.includes('ng-version=')
      ? content // Page is pre-rendered
      : undefined;
  }

  private async getHtmlTemplate(publicPath: string, pathname: string, htmlFilename = 'index.html'): Promise<string> {
    const files = [
      join(publicPath, htmlFilename),
    ];

    const potentialLocalePath = pathname.split('/', 2)[1]; // potential base href
    if (potentialLocalePath) {
      files.push(join(publicPath, potentialLocalePath, htmlFilename));
    }

    for (const file of files) {
      const content = await this.readHTMLFile(file);
      if (content) {
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

  private async readHTMLFile(path: string): Promise<string | undefined> {
    if (this.htmlFileCache.has(path)) {
      return this.htmlFileCache.get(path)!;
    }

    if (await this.fileExists(path)) {
      const content = await fs.promises.readFile(path, 'utf-8');
      this.htmlFileCache.set(path, content);

      return content;
    }

    return undefined;
  }
}
