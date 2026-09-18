# Releases

## [Unreleased]

### Improved

- A callback registered with an extra array (`'Event' 'Select' 'fn' extra`) is
  called dyadically, extra on the left, when `fn` is ambivalent (`{⍺}fn`), as
  `⎕WC` does. v0.6.0 called it monadically with the extra appended to the event
  message, which broke callbacks that take the message apart in their header.

## [v0.6.0] - 2026-09-17

The APL server and the React client now live in a single repository, and this is
the first release built from that one tree. `ewc-v0.6.0.zip` on the release page
is a runnable tree: the server, the demos and a built client together.

### Upgrading

- Download `ewc-v0.6.0.zip`.
- Building from a clone is `yarn install` then `yarn build` at the repository
  root. Yarn, not npm: the JavaScript tooling is a yarn workspace, and one
  install at the root covers both halves. `client/dist/` is no longer committed.
- The demo moved from `demo/` to `test-apps/demo/`. Update any
  `]link.create #.demo <repo>/demo` to `<repo>/test-apps/demo`.
- Do not `]link.create` the repository root. It walks `client/node_modules`,
  where package names collide as APL names and abort the whole link. Link `EWC/`
  and `test-apps/demo/` by name instead; `EWC.FOLDER` still resolves itself.
- A sibling `ewc-client/` or `jswc-client/` checkout is no longer searched for a
  client build. With the client in the same repository, a leftover sibling would
  silently shadow it.

### New

- One repository. The APL server, the demos, the User Guide and the React client
  are versioned, tested and released together, so a change spanning both halves
  is a single pull request rather than a pair.
- Plugins: applications can register their own components at runtime with
  `EWC.RegisterPlugin`, contributing EWC classes, static resources to serve and
  client JavaScript to inject. A charting or dashboard library of your choice no
  longer has to wait for Dyalog to add it.
- `Trackbar` and `ColorButton` classes.
- `Static`: the plain positioned container that pre-dates `SubForm` and `Group`,
  with no caption and no etched frame, for older applications that build their
  own panels out of it.
- `Locator`: the user positions an outline and the `Locator` event (80) reports
  where they put it, replying `(name 80 y x h w)` as `⎕DQ` does natively.
- Subsidiary windows. A non-primary `Form` in Browser and Multi modes renders as
  a floating window over the primary one, with a titlebar, its `Caption`, a close
  box and drag, rather than as a browser popup. Desktop mode is unchanged.
- `CBits` and `KeepBits` on `Bitmap`: an image supplied as a colour-bit matrix
  now renders.
- `AutoConf` and `Attach`: an object reconfigures when its parent resizes, with
  each edge either pinned or proportional, and `Configure` (31) is reported.
- `PORTTRIES`: when `PORT` is busy, EWC moves up to the next free port (ten by
  default, the way Vite steps from 5173), says which one it took, and leaves it
  in `EWC.PORT`. Set `EWC.PORTTRIES←1` to insist on `PORT` and have `Init`
  signal an error instead. The Vite dev server can be aimed at a second server
  with `?aplPort=` or `?aplUrl=`.
- `test-apps/`: EWC applications that the Playwright suite drives. `multitest`
  joins the demo, with an extensive suite covering Multi mode.
- Reference documentation is regenerated and deployed by an action, carries the
  `Dynamic` flag per property, and links to the Dyalog 20.0 documentation.

### Improved

- Mouse events report positions correctly, relative to the object that raised
  them.
- Event names are matched case-insensitively, as `⎕WC` does. An application that
  wrote `'mousedown'` was silently ignored before.
- `Active 0` greys out menus, menu items, `ColorButton` and `Trackbar` rather
  than being ignored. It is how applications disable a command.
- A `Form`'s `Caption` sets the browser tab title.
- Menu styling and layout refinements, including menu-bar items.
- `Edit`: the cursor no longer jumps while typing into a field with restricted
  input.
- `∆DQ`: `eDQ '.'` (dequeue every object) works again, and processing an event
  for an existing ID no longer exits `∆DQ`.
- `wss.aplc` logs go through EWC's own logging, and its timeout handling is more
  defensive.
- Assorted layout and styling fixes across components.

## [v0.4.0] - 2026-07-06

### New
- `Grid`: Rewrite of our old grid implementation with lots of new features and better parity with `⎕WC`
- `e2e/`: UI testing using Playwright is now a part of ewc-client
   - Adds automated visual regressions tests to github
- `EWC.LOGFILE` option: Logs can now be written to a text file rather than the session

### Improved
- `Label`, `Text`, `Subform`, `Combo`, `Grid` layout fixes 
- `Edgestyle` and `Border` are improved
- `Scroll Bar` was refactored
- Lots of internal stability fixes

## [v0.3.0] - 2026-04-29

### New

- `DropDown`, `StatusBar` and `StatusField` classes
- `Div` for embedding HTML directly, with optional `Flex` layout
- `EdgeStyle` and `Border` on `Group`, `List`, `Label`, `Edit` and `SubForm`
- Styling for `Upload` and `Link`; `Link` text is selectable
- `Form.SysMenu`, `Edit.LostFocus`, `Font.CSS`
- `Default` on `Button` (Enter activates the focused default button)
- `Active` works on `Edit` and `Button`
- Heartbeat / keep-alive so disconnected clients are detected

### Improved

- Complete rewrite of `∆DQ`; `∆NQ` supports left arguments to callbacks
- `Combo` fully rewritten — always on top, no longer crashes with no options
- `Edit`: cursor positioning, backspace and date-input behaviour now mirror `⎕WC`
- `Text` migrated from SVG to `<div>`
- `Circle`/`Ellipse`/`Polygon`/`Rectangle` bounds fixed
- `List`: keyboard navigation, single/multi selection with shift/ctrl
- `SubForm` inherits `BCol` from parent forms
- Font fallback when a requested font isn't installed

<!--
Release process:

1. Add a new section above older versions using the format:

       ## [vX.Y.Z] - YYYY-MM-DD

       - Bullet points of user-visible changes

2. Push to main (or merge a PR that touches this file). The Release
   workflow will:
   - Pull latest dist from dyalog/ewc-client@main
   - Commit any client/dist/ changes to main
   - Tag vX.Y.Z and create a GitHub Release with these notes

The version at the top of this file is the one that will be released.
Versions whose tag already exists are skipped (idempotent).
-->
