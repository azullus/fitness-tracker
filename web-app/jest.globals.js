// Jest globals file - runs BEFORE setupFilesAfterEnv
// This file sets up polyfills that need to be available before any modules are imported

const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');

// Set TextEncoder/TextDecoder globally (required by undici and other Web API polyfills)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set Web Streams API globally (required by undici)
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
