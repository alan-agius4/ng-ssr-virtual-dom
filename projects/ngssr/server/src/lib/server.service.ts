

import { JSDOM } from 'jsdom';
import { join, posix } from 'path';
import { CustomResourceLoader } from './custom-resource-loader';

export interface RenderOptions {
  referrer?: string;
  urlPath: string;
}


export interface ServiceOptions {
  htmlFilePath?: string;
  publicPath: string;
  baseUrl: string;
}

export class SSRService {
  private readonly customResourceLoader: CustomResourceLoader;

  constructor(private readonly options: ServiceOptions) {
    this.customResourceLoader = new CustomResourceLoader(this.options.baseUrl, this.options.publicPath);
  }

  async render(options: RenderOptions): Promise<string> {
    const file = join(this.options.publicPath, this.options.htmlFilePath ?? 'index.html');
    const dom = await JSDOM.fromFile(file, {
      runScripts: 'dangerously',
      resources: this.customResourceLoader,
      url: posix.join(this.options.baseUrl, options.urlPath),
      referrer: options.referrer,
    });

    return new Promise<string>((resolve, reject) => {
      dom.window.document.addEventListener('DOMContentLoaded', () => {
        const interval = setInterval(() => {
          const isStable = dom.window
            .getAllAngularTestabilities()
            .every((app: any) => app.isStable());

          if (isStable) {
            // Wait until up is stable or limit reached
            clearInterval(interval);
            resolve(dom.window.document.documentElement.outerHTML);

            return;
          }
        }, 50);
      });
    });
  }
}
