import * as vs from 'vscode';
import { Packwerk } from './packwerk';

export interface PackwerkConfig {
  executable: string;
  onSave: boolean;
  showWarnings: boolean;
}

/**
 * Read the workspace configuration for 'ruby.packwerk' and return a PackwerkConfig.
 * @return {PackwerkConfig} config object
 */
export const getConfig: () => PackwerkConfig = () => {
  const conf = vs.workspace.getConfiguration('ruby.packwerk');
  let executable = conf.get('executable', 'bin/packwerk check');

  console.debug(`[DEBUG] Parsing config, found executable '${executable}'`)

  return {
    executable,
    onSave: conf.get('onSave', true),
    showWarnings: conf.get('showWarnings', false)
  };
};

export const onDidChangeConfiguration: (packwerk: Packwerk) => () => void = (
  packwerk
) => {
  return () => (packwerk.config = getConfig());
};
