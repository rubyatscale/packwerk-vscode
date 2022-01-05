import { expect } from 'chai';
import * as vscode from 'vscode';
import { Packwerk } from '../src/packwerk';

describe('Packwerk', () => {
  let instance: Packwerk;
  let diagnostics: vscode.DiagnosticCollection;

  beforeEach(() => {
    diagnostics = vscode.languages.createDiagnosticCollection();
    instance = new Packwerk(diagnostics);
  });

  describe('initialization', () => {
    describe('.diag', () => {
      it('is set to the provided DiagnosticCollection', () => {
        expect(instance).to.have.property('diag', diagnostics);
      });
    });
  });
});
