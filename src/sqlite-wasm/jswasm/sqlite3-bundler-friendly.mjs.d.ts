declare const sqlite3InitModule: (options?: { locateFile?: (path: string, prefix?: string) => string }) => Promise<unknown>;
export default sqlite3InitModule;
