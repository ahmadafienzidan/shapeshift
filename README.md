# heic-converter

Convert HEIC/HEIF images to PNG or JPG from the command line.

## Install

```bash
bun install
```

## Usage

```bash
bun src/cli.ts <file|dir>... [options]
```

| Option | Description | Default |
| --- | --- | --- |
| `-f, --format <png\|jpg>` | Output format | `jpg` |
| `-q, --quality <0-1>` | JPEG quality | `0.92` |
| `-o, --out <dir>` | Output directory | next to input |
| `-r, --recursive` | Walk directories recursively | off |
| `-h, --help` | Show help | |

### Examples

```bash
bun src/cli.ts photo.heic
bun src/cli.ts photo.heic -f png
bun src/cli.ts ./photos -r -o ./converted -q 0.8
```

To use it as a global `heic-convert` command:

```bash
bun link
```
