import Critters from 'critters';
import { JSDOM } from 'jsdom';
import { join, posix } from 'path';
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
    });

    dom.window.eval(`ngVirtualDomRenderMode = true;`);

    return new Promise<string>((resolve, reject) => {
      dom.window.document.addEventListener('DOMContentLoaded', () => {
        const interval = setInterval(() => {
          const isStable = dom.window
            .getAllAngularTestabilities()
            .every((app: any) => app.isStable());

          if (isStable) {
            // Wait until up is stable or limit reached
            clearInterval(interval);

            // Add Angular state
            dom.window.ngVirtualDomRenderMode.addStateToDom();

            const content = dom.serialize();

            if (options.inlineCriticalCss === false) {
              resolve(content);
            } else {
              this.critters.process(content).then(resolve);
            }
          }
        }, 50);
      });
    });
  }
}
