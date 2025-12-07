// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Minimal polyfills for web APIs (Request/Response) used by Next.js
// These are minimal implementations that work with Next.js in tests
if (typeof global.Request === 'undefined') {
  class MockHeaders {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
        }
      }
    }
    get(name) { return this._headers.get(name.toLowerCase()) || null; }
    set(name, value) { this._headers.set(name.toLowerCase(), value); }
    has(name) { return this._headers.has(name.toLowerCase()); }
    append(name, value) {
      const existing = this._headers.get(name.toLowerCase());
      this._headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
    }
    delete(name) { this._headers.delete(name.toLowerCase()); }
    forEach(callback) {
      this._headers.forEach((value, key) => callback(value, key, this));
    }
    entries() {
      return this._headers.entries();
    }
    keys() {
      return this._headers.keys();
    }
    values() {
      return this._headers.values();
    }
    [Symbol.iterator]() {
      return this._headers.entries();
    }
  }

  class MockRequest {
    constructor(input, init = {}) {
      const urlValue = typeof input === 'string' ? input : input?.url || '';
      this.method = init.method || 'GET';
      this.headers = new MockHeaders(init.headers);
      this.body = init.body;
      this._bodyText = typeof init.body === 'string' ? init.body : null;
      this._bodyUsed = false;
      
      // Store url in a private property, use getter to allow subclasses to override
      this._url = urlValue;
      // Define url as a configurable property so subclasses can override
      try {
        Object.defineProperty(this, 'url', {
          get() { return this._url; },
          set(value) { this._url = value; },
          configurable: true,
          enumerable: true,
        });
      } catch (e) {
        // If url is already defined (e.g., by NextRequest), just store the value
        this._url = urlValue;
      }
    }
    async json() {
      if (this._bodyUsed) {
        throw new TypeError('Body already read');
      }
      this._bodyUsed = true;
      if (this._bodyText) {
        return JSON.parse(this._bodyText);
      }
      return {};
    }
    async text() {
      if (this._bodyUsed) {
        throw new TypeError('Body already read');
      }
      this._bodyUsed = true;
      return this._bodyText || '';
    }
    clone() {
      return new MockRequest(this.url, { method: this.method, headers: this.headers, body: this._bodyText });
    }
  }

  class MockResponse {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new MockHeaders(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this._bodyUsed = false;
      // If body is provided and not already set, set it
      if (body !== undefined && !this.body) {
        this.body = body;
      }
    }
    async json() {
      if (this._bodyUsed) {
        throw new TypeError('Body already read');
      }
      this._bodyUsed = true;
      
      // NextResponse stores body in this.body, check that first
      const bodyToRead = this.body !== undefined ? this.body : this._body;
      
      // Handle ReadableStream body (from NextResponse)
      if (bodyToRead && typeof bodyToRead.getReader === 'function') {
        const reader = bodyToRead.getReader();
        const chunks = [];
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            chunks.push(value);
          }
        }
        const text = Buffer.concat(chunks).toString('utf-8');
        return JSON.parse(text);
      }
      
      // Handle string body
      if (typeof bodyToRead === 'string') {
        return JSON.parse(bodyToRead);
      }
      
      // Handle object body (already parsed)
      if (bodyToRead && typeof bodyToRead === 'object' && bodyToRead !== null) {
        return bodyToRead;
      }
      
      // Fallback: return empty object
      return {};
    }
    async text() {
      if (this._bodyUsed) {
        throw new TypeError('Body already read');
      }
      this._bodyUsed = true;
      
      // Handle ReadableStream body
      if (this._body && typeof this._body.getReader === 'function') {
        const reader = this._body.getReader();
        const chunks = [];
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            chunks.push(value);
          }
        }
        return Buffer.concat(chunks).toString('utf-8');
      }
      
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }
    clone() {
      return new MockResponse(this._body, { status: this.status, statusText: this.statusText, headers: this.headers });
    }
    static json(data, init = {}) {
      return new MockResponse(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
    }
  }

  global.Request = MockRequest;
  global.Response = MockResponse;
  global.Headers = MockHeaders;
}
