# syntax=docker/dockerfile:1

FROM emscripten/emsdk:3.1.69

WORKDIR /src

# Clone the SQLite source tree and prepare the amalgamation for the WASM build.
RUN git clone --depth 1 https://github.com/sqlite/sqlite.git

WORKDIR /src/sqlite
RUN ./configure --enable-all
RUN make sqlite3.c

# Build the JavaScript and WebAssembly artifacts from the canonical WASM makefile.
WORKDIR /src/sqlite/ext/wasm
RUN make dist
