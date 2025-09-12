# @wuchuheng/npm-template

A modern template for creating and publishing npm libraries with TypeScript, pnpm, and best practices.

## Features

-   TypeScript-first setup
-   CLI entrypoint support
-   Ready for publishing to npm
-   pnpm for fast, reproducible installs
-   Pre-configured build with [tsup](https://tsup.egoist.dev/)
-   MIT licensed

## Getting Started

### 1. Clone this template

```bash
git clone https://github.com/wuchuheng/com.wuchuheng.npm.template.git your-lib-name
cd your-lib-name
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Develop your library

-   Source code: `src/`
-   CLI entry: `src/cli.ts`
-   Main entry: `src/main.ts`

### 4. Build

```bash
pnpm run build
```

### 5. Publish

```bash
pnpm publish --access public
```

## Usage

After publishing, users can install your library:

```bash
pnpm add @wuchuheng/npm-template
```

And use it in their projects:

```js
import /* your exports */ "@wuchuheng/npm-template";
```

Or run the CLI (if enabled):

```bash
npx @wuchuheng/npm-template
```

## License

MIT © wuchuheng
