FROM emscripten/emsdk:3.1.69 AS builder

# Install wabt package which provides wasm-strip
RUN apt-get update && apt-get install -y wabt && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Clone the SQLite source tree and prepare the amalgamation for the WASM build.
RUN git clone --depth 1 --branch version-3.50.3 https://github.com/sqlite/sqlite

WORKDIR /src/sqlite
RUN ./configure --enable-all
RUN make sqlite3.c

# Build the JavaScript and WebAssembly artifacts from the canonical WASM makefile.
WORKDIR /src/sqlite/ext/wasm
RUN make dist


# Extract the build artifacts from the builder stage.
FROM scratch AS export
COPY --from=builder \
        /src/sqlite/ext/wasm/jswasm/sqlite3.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3.wasm \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-opfs-async-proxy.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1-promiser.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1-promiser.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-api-bundler-friendly.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-api-node.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-api.js \
        /src/sqlite/ext/wasm/jswasm/sqlite3-api.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-bundler-friendly.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-node.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1-bundler-friendly.mjs \
        /src/sqlite/ext/wasm/jswasm/sqlite3-worker1-promiser-bundler-friendly.js \
        /