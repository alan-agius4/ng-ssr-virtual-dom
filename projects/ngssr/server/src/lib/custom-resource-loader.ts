import { promises } from 'fs';
import { FetchOptions, ResourceLoader } from 'jsdom';

export class CustomResourceLoader extends ResourceLoader {
  constructor(
    private readonly baseUrl: string,
    private readonly publicPath: string,
    private readonly fileCache: Map<string, Buffer>,
  ) {
    super();
  }

  fetch(url: string, options: FetchOptions): Promise<Buffer> | null {
    if (!url.endsWith('.js') || !url.startsWith(this.baseUrl)) {
      return null;
    }

    const path = url.replace(this.baseUrl, this.publicPath);
    if (this.fileCache.has(path)) {
      return Promise.resolve(this.fileCache.get(path)!);
    }

    return promises.readFile(path).then(content => {
      this.fileCache.set(path, content);
      return content;
    });
  }
}
