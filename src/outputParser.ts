import { PackwerkOutput, PackwerkFile } from './packwerkOutput';

const regex = /^(?<file>[^\n]*?):(?<row>\d+):(?<column>\d+)$(?<message>.*?::(?<symbol>.*?)['| ].*?)^\s?$/gms;

export function parseOutput(str: string): PackwerkOutput {
  try {
    return JSON.parse(str);
  } catch {
    const files = new Map<string, PackwerkFile>();

    let arr: RegExpExecArray;
    while ((arr = regex.exec(str)) !== null) {
      console.log("[DEBUG] Parsed regular expression", arr)
      const file = arr[1];
      const line = Number(arr[2]);
      const column = Number(arr[3]);
      const message = arr[4].trim();
      const symbol = arr[5];

      if (!files.has(file)) files.set(file, { path: file, violations: [] });

      files.get(file)!.violations.push({
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
