#!/usr/bin/env node
// Regenerate client/LICENSES.md: an inventory of every workspace package, then
// the full licence text of the ones actually shipped — MIT, BSD and the font
// licences all require the notice itself, not just its name.
// Run from the repo root: yarn licenses:update

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'client', 'LICENSES.md')
// Font licence texts, checked in because fonts have no node_modules to read.
const TEXT_DIR = path.join(__dirname, 'font-licenses')

// Bundled fonts, invisible to yarn. Versions come from each file's OpenType
// name table; `text` is the licence in ci/font-licenses/ to reproduce.
const FONTS = [
  {
    entry: '- APL385 Unicode (2016-08-21) - Licensed under [Freeware](https://apl385.com/)',
  },
  {
    entry:
      '- Merriweather (2.002) - Licensed under [OFL-1.1](https://github.com/EbenSorkin/Merriweather)',
    text: 'OFL-1.1.txt',
    title: 'SIL Open Font License 1.1',
    covers: 'Merriweather, Noto Sans',
  },
  {
    entry:
      '- Noto Sans (2.013) - Licensed under [OFL-1.1](https://github.com/notofonts/latin-greek-cyrillic)',
  },
  {
    entry:
      '- TeX Gyre Cursor (2.004) - Licensed under [GFL](https://www.gust.org.pl/projects/e-foundry/licenses)',
    text: 'GUST-FONT-LICENSE.txt',
    title: 'GUST Font License',
    covers: 'TeX Gyre Cursor',
  },
]

// A package.json `license` may point at a file instead of naming an SPDX id.
const NON_SPDX = {
  'SEE LICENSE IN LICENSE': {
    label: 'Custom (dual: Community / Commercial)',
    url: 'https://apexcharts.com/license',
  },
}

const isOwn = (name) =>
  name === 'ewc' || name === 'ewc-client' || name.startsWith('workspace-aggregator-')

// yarn reports repository.url verbatim, in every shape npm allows.
const cleanUrl = (url) => {
  if (!url || url === 'Unknown') return null
  let u = url.trim()
  u = u.replace(/^git\+/, '')
  u = u.replace(/^git:\/\//, 'https://')
  u = u.replace(/^ssh:\/\/git@/, 'https://')
  u = u.replace(/^git@([^:]+):/, 'https://$1/')
  // scp-style host:owner/repo survives the rewrite; that colon is a path sep.
  u = u.replace(/^(https:\/\/[^/:]+):(?!\d)/, '$1/')
  return u.replace(/\.git$/, '').replace(/\/+$/, '')
}

// yarn prints one JSON object per line; we want the `table` one.
const readTree = (extraArgs) => {
  const raw = execFileSync('yarn', ['licenses', 'list', ...extraArgs, '--json', '--no-progress'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  for (const line of raw.split('\n')) {
    if (!line.startsWith('{')) continue
    const obj = JSON.parse(line)
    if (obj.type === 'table') return obj.data.body.filter((r) => !isOwn(r[0]))
  }
  throw new Error('no license table in yarn output — is the tree installed?')
}

const byNameVersion = (a, b) => (`${a[0]}@${a[1]}` < `${b[0]}@${b[1]}` ? -1 : 1)

const summarise = ([name, version, license, url, vendorUrl]) => {
  const override = NON_SPDX[license]
  const display = name.replace(/^@/, '')
  const link = override ? override.url : cleanUrl(url) || cleanUrl(vendorUrl)
  const lic = override ? override.label : license === 'UNKNOWN' ? 'Unknown' : license
  return link
    ? `- ${display} (${version}) - Licensed under [${lic}](${link})`
    : `- ${display} (${version}) - Licensed under ${lic}`
}

// Licences arrive with mixed endings; this file is LF.
const normalise = (text) => text.replace(/\r\n/g, '\n').replace(/\s+$/, '')

const findLicenseText = (name) => {
  for (const base of ['node_modules', path.join('client', 'node_modules')]) {
    const dir = path.join(ROOT, base, name)
    let files
    try {
      files = fs.readdirSync(dir)
    } catch {
      continue
    }
    const file = files.find((n) => /^(licen[cs]e|copying)(\.|$)/i.test(n))
    if (file) return normalise(fs.readFileSync(path.join(dir, file), 'utf8'))
  }
  return null
}

// Fence longer than any backtick run inside, so licence text can't break out.
const fenced = (text) => {
  const longest = Math.max(0, ...(text.match(/`+/g) || []).map((m) => m.length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return [fence, text, fence]
}

const all = readTree([]).sort(byNameVersion)
const shipped = readTree(['--production']).sort(byNameVersion)

const missing = []
const texts = []
for (const row of shipped) {
  const [name, version, license] = row
  const text = findLicenseText(name)
  if (!text) {
    missing.push(`${name}@${version}`)
    continue
  }
  const label = NON_SPDX[license] ? NON_SPDX[license].label : license
  texts.push(`#### ${name} (${version}) — ${label}`, '', ...fenced(text), '')
}

const fontTexts = []
for (const font of FONTS) {
  if (!font.text) continue
  const text = normalise(fs.readFileSync(path.join(TEXT_DIR, font.text), 'utf8'))
  fontTexts.push(`#### ${font.title} — covers ${font.covers}`, '', ...fenced(text), '')
}

const out = [
  '## Third-Party Licenses',
  '',
  'This project uses the following open-source packages:',
  '',
  ...all.map(summarise),
  '',
  '### Fonts',
  '',
  'Bundled in the client build and served via `@font-face`:',
  '',
  ...FONTS.map((f) => f.entry),
  '',
  "`font.css` declares TeX Gyre Cursor under the family name `Nimbus Mono`, which",
  'is the name APL code asks for. A CSS family name is a local alias and does not',
  'rename the font. TeX Gyre Cursor descends from the same URW Nimbus Mono L',
  'design, released to GUST under the GFL, and states its licence inside the font',
  'file; the previous Nimbus Mono files did not, and their terms could not be',
  'established.',
  '',
  '---',
  '',
  '## Full licence texts',
  '',
  'MIT, BSD and the font licences require their notice to accompany the software,',
  'so the licences of everything actually redistributed are reproduced below. The',
  `${shipped.length} packages here are those bundled into the client build; the rest of the`,
  'inventory above is development tooling, which is never distributed and carries',
  'no such condition.',
  '',
  '### Bundled packages',
  '',
  ...texts,
  '### Fonts',
  '',
  ...fontTexts,
  'APL385 Unicode records only a copyright line — `Copyright 2016, Adrian Smith` —',
  'with no licence text in the font file and none published alongside it. It is',
  'distributed at no cost from <https://apl385.com/> and ships with Dyalog APL.',
  '',
].join('\n')

fs.writeFileSync(OUT, out, 'utf8')
if (missing.length) {
  console.error(`WARNING: no licence file found for: ${missing.join(', ')}`)
  process.exitCode = 1
}
const reproduced = shipped.length - missing.length
console.log(
  `client/LICENSES.md: ${all.length} packages inventoried, ` +
    `${reproduced} package licences + ${fontTexts.length ? 2 : 0} font licences reproduced`,
)
