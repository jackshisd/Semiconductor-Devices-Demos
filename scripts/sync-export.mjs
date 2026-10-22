import { cpSync, existsSync, rmSync, realpathSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('.next-build');
const target = resolve('out');
if (!existsSync(resolve(source, 'index.html'))) throw new Error('Static export was not generated.');
// A copy over an old export leaves removed routes and obsolete assets deployable.
// Refuse symlinks or any unexpected target before clearing generated output.
if (target !== resolve(process.cwd(), 'out') || target === source)
  throw new Error('Unsafe export target.');
if (existsSync(target)) {
  if (lstatSync(target).isSymbolicLink() || realpathSync(target) !== target)
    throw new Error('Export target must be a local directory.');
  rmSync(target, { recursive: true, force: true });
}
cpSync(source, target, { recursive: true, force: true });
console.log(`Static export copied to ${target}`);
