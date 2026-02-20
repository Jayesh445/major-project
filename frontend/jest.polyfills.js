// jest.polyfills.js
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, TransformStream, WritableStream } = require('node:stream/web')

Object.defineProperties(globalThis, {
  TextEncoder: { value: TextEncoder },
  TextDecoder: { value: TextDecoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
  WritableStream: { value: WritableStream },
  BroadcastChannel: { value: class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
  }},
})

const { Blob, File } = require('node:buffer')

Object.defineProperties(globalThis, {
  Blob: { value: Blob },
  File: { value: File },
})

require('whatwg-fetch')
