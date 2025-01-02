import { createCounter } from '../utils';
import { createMethod } from '../store';

const tempId = createCounter(`file:${(Math.random() + 1).toString(36)}`);

const FILES_URL = `${API_URL}/api/files`;

type FilesUpload = {
  streamId: string;
  files: FileList;
};

type FileUpload = {
  streamId: string;
  file: File;
};

export const uploadMany = createMethod('files/uploadMany', async ({ streamId, files }: FilesUpload, { dispatch }) => {
  console.log('uploading many files', streamId, files);
  for (let i = 0, file; i < files.length; i++) {
    file = files.item(i);
     
    if (!file) continue;
    dispatch(upload({ streamId, file }));
  }
});

const isError = (err: unknown): err is Error => err instanceof Error;

export const upload = createMethod('files/upload', async ({ streamId, file }: FileUpload, { dispatch, actions }) => {
  console.log('uploading file', file.name, file.size, file.type);
  const local = {
    streamId,
    clientId: tempId(),
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    progress: 0,
    status: 'uploading',
  };

  dispatch(actions.files.add(local));

  try {
    const { status, id: fileId } = await uploadFile({
      stream: file.stream(),
      fileSize: file.size,
      fileName: file.name,
      contentType: file.type,
      onProgress: (progress) => {
        dispatch(actions.files.update({ id: local.clientId, file: { progress } }));
      },
    });

    if (status === 'ok') {
      dispatch(actions.files.update({ id: local.clientId, file: { id: fileId, progress: 100, status: 'ok' } }));
    } else {
      dispatch(actions.files.update({
        id: local.clientId,
        file: {
          error: 'something went wrong',
          progress: 0,
        },
      }));
    }
  } catch (err) {
    if (isError(err)) {
      dispatch(actions.files.update({
        id: local.clientId,
        file: {
          error: err.message,
          progress: 0,
        },
      }));
    }
     
    console.error(err);
  }
});

export const getUrl = (id: string) => `${FILES_URL}/${id}`;
export const getThumbnail = (id: string, size?: {w?: number, h?: number}) => {
  const params = new URLSearchParams();
  if(size?.w) params.set('w', size.w.toString());
  if(size?.h) params.set('h', size.h.toString());
  return `${getUrl(id)}?${params.toString()}`;
}
export const getDownloadUrl = (id: string) => `${getUrl(id)}?download=true`;
const aborts: Record<string, (() => void)> = {};

export const abort = createMethod('files/abort', async (clientId: string, { dispatch, actions }) => {
  try {
    if (aborts[clientId]) aborts[clientId]();
    dispatch(actions.files.remove(clientId));
  } catch (err) {
     
    console.error(err);
  }
});

type UploadArgs = {
  stream: ReadableStream,
  fileSize: number,
  fileName: string,
  contentType: string,
  onProgress: (percentage: number) => void,
};

type UploadResponse = {
  status: string;
  id: string;
};

async function uploadFile(args: UploadArgs): Promise<UploadResponse> {
  let uploadedSize = 0;
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
  const res = await fetch(FILES_URL, {
    method: 'POST',
    // @ts-ignore
    duplex: 'half',
    headers: {
      Authorization: `Bearer ${localStorage.token}`,
      'Content-Type': args.contentType || 'application/octet-stream',
      'Content-Length': args.fileSize.toString(),
      'Content-Disposition': `attachment; filename="${args.fileName}"`,
    },
    body: blobStream,
  });

  return await res.json();
}
/*
function uploadFileOld(args: UploadArgs): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => {
      const data = JSON.parse(xhr.responseText);
      resolve(data);
    }, { once: true });
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        args.onProgress((e.loaded / e.total) * 100);
      }
    });
    xhr.addEventListener('error', (e) => reject(e), { once: true });
    xhr.open('POST', FILES_URL, true);

    const formData = new FormData();
    formData.append('file', args.stream);
    aborts[clientId] = () => xhr.abort();
    xhr.send(formData);
  });
}
*/
