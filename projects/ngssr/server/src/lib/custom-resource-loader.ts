import { readFileSync } from 'fs';
import { ResourceLoader } from 'jsdom';

export class CustomResourceLoader extends ResourceLoader {
  private readonly fileCache = new Map<string, Buffer>();

  constructor(
    private readonly baseUrl: string,
    private readonly publicPath: string
  ) {
    super();
  }

  fetch(url: string): Promise<Buffer> | null {
    if (!url.startsWith(this.baseUrl)) {
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
