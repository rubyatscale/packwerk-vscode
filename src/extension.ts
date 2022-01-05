import * as vscode from 'vscode';
import { Packwerk } from './packwerk';
import { onDidChangeConfiguration } from './configuration';

// entry point of extension
export function activate(context: vscode.ExtensionContext): void {
  'use strict';

  const diag = vscode.languages.createDiagnosticCollection('ruby');
  context.subscriptions.push(diag);

  const packwerk = new Packwerk(diag);
  const disposable = vscode.commands.registerCommand('ruby.packwerk', () => {
    const document = vscode.window.activeTextEditor.document;
    packwerk.execute(document);
  });

  context.subscriptions.push(disposable);

  const ws = vscode.workspace;

  ws.onDidChangeConfiguration(onDidChangeConfiguration(packwerk));

  ws.textDocuments.forEach((e: vscode.TextDocument) => {
    packwerk.execute(e);
  });

  ws.onDidOpenTextDocument((e: vscode.TextDocument) => {
    packwerk.execute(e);
  });

  ws.onDidSaveTextDocument((e: vscode.TextDocument) => {
    if (packwerk.isOnSave) {
      packwerk.execute(e);
    }
  });

  ws.onDidCloseTextDocument((e: vscode.TextDocument) => {
    packwerk.clear(e);
  });
}
