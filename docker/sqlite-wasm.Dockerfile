# syntax=docker/dockerfile:1

FROM emscripten/emsdk:3.1.69 AS builder

WORKDIR /src

# Clone the SQLite source tree and prepare the amalgamation for the WASM build.
RUN git clone --depth 1 https://github.com/sqlite/sqlite.git

WORKDIR /src/sqlite
RUN ./configure --enable-all
RUN make sqlite3.c

# Build the JavaScript and WebAssembly artifacts from the canonical WASM makefile.
WORKDIR /src/sqlite/ext/wasm
RUN make dist

FROM scratch AS export
COPY --from=builder \
        /src/sqlite/ext/wasm/jswasm/sqlite3.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3.wasm \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-opfs-async-proxy.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-opfs-async-proxy.mjs \
        /
