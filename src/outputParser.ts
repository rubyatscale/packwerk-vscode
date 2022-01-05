import { PackwerkOutput, PackwerkFile } from './packwerkOutput';

const regex = /^(?<file>[^\n]*?):(?<row>\d+):(?<column>\d+)$(?<message>(?<type>[^ ]+).*?'::(?<symbol>.*?)'.*?)^\s?$/gms;

export function parseOutput(str: string): PackwerkOutput {
  try {
    return JSON.parse(str);
  } catch {
    const files = new Map<string, PackwerkFile>();

    let arr: RegExpExecArray;
    while ((arr = regex.exec(str)) !== null) {
      const file = arr[1];
      const line = Number(arr[2]);
      const column = Number(arr[3]);
      const message = arr[4].trim();
      const type = arr[5].toLocaleLowerCase().trim();
      const symbol = arr[6];

      if (!files.has(file)) files.set(file, { path: file, violations: [] });

      files.get(file)!.violations.push({
        type,
        message,
        location: {
          line,
          column,
          length: symbol.length,
        },
      });
    }

    return {
      files: Array.from(files.values()),
    };
  }
}
