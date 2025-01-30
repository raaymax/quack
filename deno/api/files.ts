import type API from "./mod.ts";
import { FileUpload } from "./types.ts";

export class FilesAPI {
  aborts: Record<string, () => void> = {};
  api: API

  constructor(api: API) {
    this.api = api;
  }

  isRequestStreamSupported = (() => {
    let duplexAccessed = false;

    const hasContentType = new Request('', {
      body: new ReadableStream(),
      method: 'POST',
      // @ts-ignore This is a method to check if the browser supports duplex streams
      get duplex() {
        duplexAccessed = true;
        return 'half';
      },
    }).headers.has('Content-Type');

    return duplexAccessed && !hasContentType;
  })();

  abort(clientId: string) {
    this.aborts[clientId]?.();
  }

  upload = async (args: FileUpload): Promise<{status: string, id: string}> => {
    if (this.isRequestStreamSupported) {
      return this.uplaodFileStream(args);
    } else {
      return this.uploadFileOld(args);
    }
  }

  private uploadFileOld = async (args: FileUpload): Promise<{status: string, id: string}> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore This is only for browsers
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => {
        const data = JSON.parse(xhr.responseText);
        delete this.aborts[args.clientId];
        resolve(data);
      }, { once: true });
      xhr.upload.addEventListener('progress', (e: any) => {
        if (e.lengthComputable) {
          args.onProgress?.((e.loaded / e.total) * 100);
        }
      });
      xhr.addEventListener('error', (e: any) =>{
        delete this.aborts[args.clientId];
        reject(e);
      }, { once: true });
      xhr.open('POST', '/api/files', true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.api.token}`);

      const formData = new FormData();
      this.streamToBlob(args.stream, args.contentType)
        .then((blob) => {
          formData.append('file', blob, args.fileName);
          this.aborts[args.clientId] = () => xhr.abort();
          xhr.send(formData);
        })
    });
  }


  private uplaodFileStream = async (args: FileUpload): Promise<{status: string, id: string}> => {
    let uploadedSize = 0;
    const abortController = new AbortController();
    this.aborts[args.clientId] = () => abortController.abort();
    const blobStream = args.stream.pipeThrough(
      new TransformStream({
        async transform(chunk, controller) {
          uploadedSize += chunk.length;
          console.log('uploadedSize', uploadedSize);
          args.onProgress?.(uploadedSize / args.fileSize * 100);
          controller.enqueue(chunk);
        },
      }),
    );
    const res = await this.api.fetchWithCredentials('/api/files', {
      method: 'POST',
      signal: abortController.signal,
      duplex: 'half',
      headers: {
        Authorization: `Bearer ${localStorage.token}`,
        'Content-Type': args.contentType || 'application/octet-stream',
        'Content-Length': args.fileSize.toString(),
        'Content-Disposition': `attachment; filename="${args.fileName}"`,
      },
      body: blobStream,
    });

    delete this.aborts[args.clientId];

    return await res.json();
  }

  private streamToBlob = (stream: ReadableStream, mimeType: string): Promise<Blob> => {
    if (mimeType != null && typeof mimeType !== 'string') {
      throw new Error('Invalid mimetype, expected string.')
    }
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const chunks: any[] = []
          for await (const chunk of stream) {
            chunks.push(chunk.value)
          }
          const blob = mimeType != null
            ? new Blob(chunks, { type: mimeType })
            : new Blob(chunks)
          resolve(blob)
        }catch(e){
          reject(e)
        }
      })()
    })
  }
}
