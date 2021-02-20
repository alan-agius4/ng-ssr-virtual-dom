import { readFileSync } from 'fs';
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
      this.fileCache.get(path);
    }

    const content = readFileSync(path);
    this.fileCache.set(path, content);

    return Promise.resolve(content);
  }
}
