import {
  PackwerkOutput,
  PackwerkFile,
  PackwerkViolation,
} from './packwerkOutput';
import { TaskQueue, Task } from './taskQueue';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig, PackwerkConfig } from './configuration';
import * as os from 'os';
import { parseOutput } from './outputParser';

function isFileUri(uri: vscode.Uri): boolean {
  return uri.scheme === 'file';
}

function getCurrentPath(fileName: string): string {
  return vscode.workspace.rootPath || path.dirname(fileName);
}

export class Packwerk {
  public config: PackwerkConfig;
  private diag: vscode.DiagnosticCollection;
  private taskQueue: TaskQueue = new TaskQueue();

  constructor(
    diagnostics: vscode.DiagnosticCollection,
  ) {
    this.diag = diagnostics;
    this.config = getConfig();
  }

  public execute(document: vscode.TextDocument, onComplete?: () => void): void {
    if (
      (document.languageId !== 'gemfile' && document.languageId !== 'ruby') ||
      document.isUntitled ||
      !isFileUri(document.uri)
    ) {
      // git diff has ruby-mode. but it is Untitled file.
      return;
    }

    const fileName = document.fileName;
    const uri = document.uri;
    let currentPath = getCurrentPath(fileName);
    let relativeFileName = fileName.replace(currentPath + '/', '')

    let onDidExec = (error: Error, stdout: string, stderr: string) => {
      console.debug(`[DEBUG] Finished running command, in onDidExec`)
      console.debug(`[DEBUG] Error, stderr`, error, stderr)
      this.reportError(error, stderr);
      let packwerk = this.parse(stdout);
      if (packwerk === undefined || packwerk === null) {
        console.debug(`[DEBUG] packwerk is undefined or null, returning from onDidExec`)
        return;
      }

      this.diag.delete(uri);

      let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
      packwerk.files.forEach((file: PackwerkFile) => {
        let diagnostics = [];
        file.violations.forEach((offence: PackwerkViolation) => {
          const loc = offence.location;
          const range = new vscode.Range(
            loc.line - 1,
            loc.column,
            loc.line - 1,
            loc.length + loc.column
          );

          // https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings/29497680
          let decolorizedMessage = offence.message.replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

          const message = decolorizedMessage;
          console.debug(`[DEBUG] Adding vscode.Diagnostic:`, { range, message })
          const diagnostic = new vscode.Diagnostic(
            range,
            message,
            vscode.DiagnosticSeverity.Error
          );
          diagnostics.push(diagnostic);
        });
        entries.push([uri, diagnostics]);
      });

      this.diag.set(entries);
    };

    let task = new Task(uri, (token) => {
      let process = this.executePackwerkCheck(
        relativeFileName,
        document.getText(),
        { cwd: currentPath },
        (error, stdout, stderr) => {
          if (token.isCanceled) {
            return;
          }
          onDidExec(error, stdout, stderr);
          token.finished();
          if (onComplete) {
            onComplete();
          }
        }
      );
      return () => process.kill();
    });

    this.taskQueue.enqueue(task);
  }

  public get isOnSave(): boolean {
    return this.config.onSave;
  }

  public clear(document: vscode.TextDocument): void {
    let uri = document.uri;
    if (isFileUri(uri)) {
      this.taskQueue.cancel(uri);
      this.diag.delete(uri);
    }
  }

  private executePackwerkCheck(
    fileName: string,
    fileContents: string,
    options: cp.ExecOptions,
    cb: (err: Error, stdout: string, stderr: string) => void
  ): cp.ChildProcess {
    let command = `${this.config.executable} ${fileName}`
    console.debug(`[DEBUG] Running command ${command}`)

    let child = cp.exec(command, options, cb);
    child.stdin.write(fileContents); // why do we need this?
    child.stdin.end();
    return child;
  }

  private parse(output: string): PackwerkOutput | null {
    let packwerk: PackwerkOutput;
    if (output.length < 1) {
      console.debug(`[DEBUG] Output is ${output}`)
      let message = `command ${this.config.executable} returns empty output! please check configuration.`;
      console.debug(`[DEBUG] ${message}`)
      // For now, we do not show this error message. There are lots of reasons why this could fail, so
      // we turn it off so as to not bother the user
      // vscode.window.showWarningMessage(message);

      return null;
    }

    try {
      packwerk = parseOutput(output);
    } catch (e) {
      if (e instanceof SyntaxError) {
        let regex = /[\r\n \t]/g;
        let message = output.replace(regex, ' ');
        let errorMessage = `Error on parsing output (It might non-JSON output) : "${message}"`;
        vscode.window.showWarningMessage(errorMessage);

        return null;
      }
    }

    return packwerk;
  }

  private reportError(error: Error, stderr: string): boolean {
    let errorOutput = stderr.toString();
    if (error && (<any>error).code === 'ENOENT') {
      vscode.window.showWarningMessage(
        `${this.config.executable} is not executable`
      );
      return true;
    } else if (error && (<any>error).code === 127 && this.config.showWarnings) {
      console.debug('[DEBUG] Showing error with code 127', stderr)
      vscode.window.showWarningMessage(stderr);
      return true;
    } else if (errorOutput.length > 0 && this.config.showWarnings) {
      console.debug('[DEBUG] Showing error with errorOutput.length > 0', stderr)
      vscode.window.showWarningMessage(stderr);
      return true;
    }

    return false;
  }
}
