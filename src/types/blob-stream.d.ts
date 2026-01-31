declare module 'blob-stream' {
    import { Writable } from 'stream';
    function blobStream(): blobStream.IBlobStream;
    namespace blobStream {
        interface IBlobStream extends Writable {
            toBlob(type?: string): Blob;
            toBlobURL(type?: string): string;
        }
    }
    export = blobStream;
}
