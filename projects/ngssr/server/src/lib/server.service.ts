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
      let count = 0;
      dom.window.document.addEventListener('DOMContentLoaded', () => {
        const interval = setInterval(() => {
          if (dom.window.ngIsStable) {
            // Wait until up is stable or limit reached
            clearInterval(interval);
            resolve(dom.window.document.documentElement.outerHTML);

            return;
          }

          if (count === 500) {
            reject(new Error(`Application didn't stabilize in time.`));
          }

          count++;
        }, 40);
      });
    });
  }
}
