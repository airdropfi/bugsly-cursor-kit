#!/usr/bin/env node
// Structure checks for this Cursor kit. No dependencies: node scripts/validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const err = (m) => errors.push(m);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => {
  try { return JSON.parse(read(p)); } catch (e) { err(`${p}: ${e.message}`); return null; }
};
const SECRET = /(bgs_[A-Za-z0-9]{8,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+(?!YOUR_|\$\{)[A-Za-z0-9._-]{20,})/;
const LOCAL = /(\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+|C:\\Users\\)/;

const plugin = json('.cursor-plugin/plugin.json');
if (plugin) {
  for (const k of ['name', 'description', 'version', 'repository', 'license', 'logo']) if (!plugin[k]) err(`plugin.json: ${k} is required`);
  if (plugin.name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(plugin.name)) err('plugin.json: name must be lowercase with dashes');
  if (plugin.version && !/^\d+\.\d+\.\d+$/.test(plugin.version)) err('plugin.json: version must be semver');
  if (plugin.logo && !fs.existsSync(path.join(root, plugin.logo))) err(`plugin.json: logo ${plugin.logo} not found`);
}
for (const f of ['mcp.json', '.mcp.json']) {
  const m = json(f);
  if (!m || typeof m.mcpServers !== 'object') { err(`${f}: mcpServers object required`); continue; }
  for (const [name, s] of Object.entries(m.mcpServers)) {
    try { if (new URL(s.url).protocol !== 'https:') err(`${f}: ${name}.url must be https`); } catch { err(`${f}: ${name}.url invalid`); }
    for (const [h, v] of Object.entries(s.headers ?? {})) {
      if (!/\$\{(env:)?[A-Z_]+\}/.test(v)) err(`${f}: header ${h} must come from an environment variable`);
    }
  }
}
const rulesDir = path.join(root, 'rules');
for (const f of fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir) : []) {
  const t = read(`rules/${f}`);
  if (!f.endsWith('.mdc')) err(`rules/${f}: rules must be .mdc`);
  else if (!/^---\n[\s\S]*?description:[\s\S]*?\n---\n/.test(t)) err(`rules/${f}: frontmatter with description required`);
}
const skillsDir = path.join(root, 'skills');
for (const d of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []) {
  const p = `skills/${d}/SKILL.md`;
  if (!fs.existsSync(path.join(root, p))) { err(`${p}: missing`); continue; }
  const m = /^---\n([\s\S]*?)\n---\n/.exec(read(p));
  if (!m) { err(`${p}: frontmatter required`); continue; }
  const name = /^name:\s*(.+)$/m.exec(m[1])?.[1].trim();
  if (name !== d) err(`${p}: name "${name}" must equal the folder name`);
  if (!/^description:\s*\S/m.test(m[1])) err(`${p}: description required`);
}
for (const f of ['README.md', 'LICENSE', 'examples/prompts.md']) if (!fs.existsSync(path.join(root, f))) err(`${f}: missing`);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === '.git' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(root)) {
  const rel = path.relative(root, f);
  if (/\.(md|mdc|json|mjs)$/.test(rel) && rel !== 'scripts/validate.mjs') {
    const t = fs.readFileSync(f, 'utf8');
    if (SECRET.test(t)) err(`${rel}: looks like a credential`);
    if (LOCAL.test(t)) err(`${rel}: local filesystem path`);
  }
}
for (const e of errors) console.error(`error: ${e}`);
if (!errors.length) console.log('ok: plugin.json, mcp.json, .mcp.json, rules, skills');
process.exit(errors.length ? 1 : 0);
