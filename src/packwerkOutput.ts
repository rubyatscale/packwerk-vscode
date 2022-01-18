interface PackwerkLocation {
  line: number;
  column: number;
  length: number;
}

export interface PackwerkViolation {
  message: string;
  location: PackwerkLocation;
}

export interface PackwerkFile {
  path: string;
  violations: Array<PackwerkViolation>;
}

export interface PackwerkOutput {
  files: Array<PackwerkFile>;
}
