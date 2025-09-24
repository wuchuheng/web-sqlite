# Technical Context: SQLite WASM Implementation

## Core Technologies

### SQLite WASM
- **Version**: Latest SQLite compiled to WebAssembly
- **Worker File**: `jswasm/sqlite3-worker1.js`
- **Storage**: OPFS (Origin Private File System) only
- **Communication**: Message-passing via Web Workers

### Browser APIs Required
- **WebAssembly**: Core WASM support
- **Web Workers**: Background thread execution  
- **OPFS**: Persistent file system storage
- **Cross-Origin Isolation**: Required for SharedArrayBuffer features

### File Dependencies
```
jswasm/
├── sqlite3-worker1.js                    - Main worker script
├── sqlite3-worker1-bundler-friendly.mjs  - Module version
├── sqlite3-opfs-async-proxy.js          - OPFS helper
├── sqlite3.wasm                         - WebAssembly binary
└── [other sqlite files...]              - Additional utilities
```

## Development Constraints

### Browser Requirements
- **Modern Browsers**: Chrome 86+, Firefox 89+, Safari 15.2+
- **Secure Context**: HTTPS required for OPFS
- **COOP/COEP Headers**: Recommended for optimal performance
- **WebAssembly**: Must be enabled

### Storage Limitations
- **OPFS Only**: Remove memory and other VFS options
- **File-based**: Database persists as actual files
- **Origin-bound**: Storage isolated per origin
- **Quota**: Subject to browser storage limits

### Performance Considerations
- **Worker Thread**: Non-blocking database operations
- **Message Overhead**: Serialization costs for large results
- **Memory Usage**: WASM heap + JavaScript heap

## Current Dependencies to Remove

### Unnecessary Features
1. **Memory Database Support**: `:memory:` databases
2. **Multiple VFS Options**: Only OPFS needed
3. **Legacy Browser Support**: Modern browsers only
4. **Alternative Worker Loading**: Simplify to single path

### Configuration Complexity
- Remove multiple initialization paths
- Simplify VFS selection logic
- Remove fallback mechanisms

## Target Architecture

### Simplified Tech Stack
- **Single Storage**: OPFS only
- **Single Worker**: One worker loading path
- **Pure Functions**: No classes or complex inheritance
- **Event-Driven**: Functional reactive patterns
