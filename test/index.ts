import * as fs from 'fs';
import * as Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
  const mocha = new Mocha({
    color: true,
    ui: 'bdd',
  });

  const testsRoot = path.resolve(__dirname, '.');
  const files = fs
    .readdirSync(testsRoot)
    .filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'runTests.js');

  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
