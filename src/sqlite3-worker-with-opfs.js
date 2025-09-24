/**
 * Custom SQLite worker wrapper that provides OPFS proxy URL for inlined workers
 * This solves the issue where the OPFS proxy file cannot be loaded when the worker is inlined
 */

// Import the OPFS proxy code as raw text
import opfsProxyCode from './jswasm/sqlite3-opfs-async-proxy.js?raw';
import { default as sqlite3InitModule } from './jswasm/sqlite3-bundler-friendly.mjs';

// Create the OPFS proxy worker blob URL
const opfsProxyBlob = new Blob([opfsProxyCode], { 
  type: 'application/javascript' 
});
const opfsProxyUrl = URL.createObjectURL(opfsProxyBlob);

// Initialize SQLite with the OPFS proxy URL provided
sqlite3InitModule({
  // Override the default OPFS proxy URI
  opfsProxyUri: opfsProxyUrl
}).then(sqlite3 => {
  // Set the OPFS proxy URI in the config before initializing
  if (sqlite3.installOpfsVfs) {
    sqlite3.installOpfsVfs.defaultProxyUri = opfsProxyUrl;
  }
  
  // Initialize the worker API
  sqlite3.initWorker1API();
});
