import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('.next-build');
const target = resolve('out');
if (!existsSync(resolve(source, 'index.html'))) throw new Error('Static export was not generated.');
cpSync(source, target, { recursive: true, force: true });
console.log(`Static export copied to ${target}`);
