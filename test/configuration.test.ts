import { expect } from 'chai';
import * as cp from 'child_process';
import * as pq from 'proxyquire';
import * as vsStub from 'vscode';

// override vs.workspace.getConfiguration to return default values for each of the extension's
// defined configuration options, and not depend on what is configured by the user
const { getConfiguration: _getConfiguration } = vsStub.workspace;

vsStub.workspace.getConfiguration = (
  section?: string,
  resource?: vsStub.Uri | null
): any => {
  if (section !== 'ruby.packwerk') {
    return _getConfiguration(section, resource);
  }

  const defaultConfig = {
    onSave: true,
  };

  return {
    get: <T>(section: string, defaultValue: T): T =>
      defaultConfig[section] || defaultValue,
  };
};

const childProcessStub: any = {};
const extensionConfig = pq('../src/configuration', {
  child_process: childProcessStub,
  vscode: vsStub,
});

const { getConfig } = extensionConfig;

describe('PackwerkConfig', () => {
  describe('getConfig', () => {
    describe('.executable', () => {
      it('is set to "bin/packwerk" by default', () => {
        expect(getConfig()).to.have.property(
          'executable',
          'bin/packwerk'
        );
      });

      describe('.onSave', () => {
        it('is set', () => {
          expect(getConfig()).to.have.property('onSave');
        });
      });
    });
  });
});
