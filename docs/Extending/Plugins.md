# Plugins

A plugin is an APL library that registers its own components with EWC at
runtime - EWC classes, static resources to serve, and JavaScript to inject
into the client. Nothing about a plugin is built into EWC. A charting
library, a widget set, or a one-off visual effect can be developed, versioned
and shipped entirely outside the EWC repository, and an application picks it
up with one function call:

```apl
      ]link.create /path/to/ewc/EWC
      ]link.create GlobePlugin /path/to/ewc-plugins/globe/APLSource
      GlobePlugin.Register       ⍝ calls EWC.RegisterPlugin
      EWC.Init 'Browser'
```

`Register` can be called before or after `EWC.Init`, so a plugin may register
at any point in a session. After that, its classes work like the built-in
ones:

```apl
      'F1.G' eWC 'Globe' ('Values' data) ('Event' 'click' 'CBGlobe')
      'F1.G' eWS 'Values' data
```

## Why plugins

The plugin boundary is also a licensing boundary. There are three layers:
EWC, then the plugin, then the third-party library. EWC is open source, a
plugin is a little open-source glue, and the JavaScript library underneath is
each user's own relationship with its vendor.

A plugin repository ships no third-party code. The library arrives from npm
or a CDN, on the user's machine, under the vendor's own terms. That is what
lets commercial or licence-restricted libraries be used from EWC without
anyone redistributing them, and it keeps EWC free of dependencies it would
otherwise have to carry for everyone.

## Existing plugins

[dyalog-labs/ewc-plugins](https://github.com/dyalog-labs/ewc-plugins) collects
plugins, one folder per plugin:

| Plugin | What it provides |
|--------|------------------|
| fireworks | A `Fireworks` full-page overlay |
| kendo | `KendoChart`, `KendoGrid`, `KendoSankey` over Kendo UI (bring your own licence) |
| apexcharts | `ApexChart` over ApexCharts |
| globe | A `Globe` 3D choropleth over globe.gl - built step by step in the tutorial |

## Where next

- [Plugin Architecture](Architecture.md) - the contract. What a plugin
  registers, how its classes are defined, how its JavaScript reaches the
  browser, and what the client provides to plugin components.
- [Building a Plugin](Tutorial.md) - the tutorial. Wrap
  [globe.gl](https://globe.gl/) as an EWC class, from empty folder to
  spinning globe.
