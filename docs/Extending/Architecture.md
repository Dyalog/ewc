# Plugin Architecture

This page is the contract: what `EWC.RegisterPlugin` accepts, how a class is
defined, how a plugin's JavaScript reaches the browser, and what the client
provides to plugin components. For a guided walk through building one, see
[Building a Plugin](Tutorial.md).

## Registering a plugin

`EWC.RegisterPlugin` takes a namespace with these members:

| Member | Required | Contents |
|--------|----------|----------|
| `Name` | yes | The plugin id, and also the key its classes are tagged with. A plugin may not be called `classes`. |
| `Classes` | yes | A namespace whose sub-namespaces are EWC class definitions (see below). |
| `Folder` | no | The plugin's root folder on disk. EWC does not read it - it is the conventional place for the plugin to build its own `Resources` paths from. |
| `Inject` | no | A niladic function returning the JavaScript to evaluate in the client, or the JavaScript itself as a character vector. Evaluated the first time one of the plugin's classes is created. |
| `Resources` | no | An `(alias folder)` pair, or a 2-column matrix of them. Folders EWC should serve over HTTP. |

Class definitions are **copied** at registration rather than referenced, so
you can re-register a plugin after editing its source without stale state.
Just call `Register` again.

## Defining a class

A class definition is a namespace holding seven variables. It is the same
shape as EWC's own classes, one file per variable when the plugin is on disk:

| Variable | Contents |
|----------|----------|
| `ClassName` | The cased `Type` the client sees, e.g. `'Globe'`. |
| `PropList` | Every property the class understands, in order. This must include `'PropList'` itself, or `⎕WS` cannot reach the client. |
| `Defaults` | A default value per `PropList` entry - same length, same order. |
| `Supported` | The subset of `PropList` that is actually implemented. Anything else draws a warning when set. |
| `Dynamic` | Properties whose value lives in the browser and must be read back on `⎕WG`, such as a caret position or a rendered SVG. |
| `methodlist` | Names that `2 ⎕NQ` should treat as methods rather than events. |
| `SupportedEvents` | Event names the class reports. Character event names pass through EWC untouched, so custom names need no other registration. |

Registration validates the definition, and signals an error for a missing
`ClassName`, an empty `PropList`, or a `Defaults` of the wrong length.

Class names are matched case-insensitively on the APL side, as `⎕WC` does,
but a plugin class cannot shadow a built-in one - EWC's own classes are
looked up first. In the client the registered `Type` is matched exactly, so
register the component under the same casing as `ClassName`.

### Property names that never reach the client

`Data`, `ChildList`, `EventList` and `PropList` are stripped from every
message before it is sent to the browser. `Data` is `⎕WC`'s user-data
property, which is arbitrary APL values an application attaches to an object,
stored server-side by design (EWC itself uses it internally). Don't name a
plugin property `Data` and expect the component to see it. Pick another name,
such as `Values`.

## Serving static resources

`Resources` mounts folders into EWC's HTTP server. The alias becomes the
first path segment:

```apl
plugin.Resources←'globe' (folder,'/assets')
```

That serves `<folder>/assets/globe.js` at `/globe/globe.js`. It works whether
the plugin registers before or after `Init`, and it is how a plugin's
JavaScript, stylesheets and images get to the browser without being embedded
in APL source.

In the client, resolve such paths with `window.EWC.url(path)` rather than
using them bare. EWC owns the mounted *path*, but only the browser knows the
*origin* it reaches EWC on - behind a proxy, say, or during client
development when the page is served by Vite on one port and EWC runs on
another.

!!! note
    An application that assigns `EWC.RESOURCES←...` replaces the whole table,
    plugin aliases included. `EWC.Init` re-applies every registered plugin's
    resources, so registration order does not matter, but an assignment
    *after* `Init` will drop them. Add rows with `alias EWC.AddResource
    folder` instead.

## Injecting client code

The first time one of a plugin's classes is created in a session, EWC
evaluates the plugin's `Inject` JavaScript in that client. That is once per
browser connection rather than once per object, and a reload gets it again.
Creating the first object is what triggers it, so a plugin that is registered
but never used costs the client nothing.

Injection is deferred to first use rather than done at connection time, and
that is what frees registration from ordering constraints. A plugin can
register long after `Init`, or in response to something the application only
discovers at runtime, and its JavaScript still arrives exactly when the first
object needs it.

The client holds all later messages until the injected code has settled,
including any promise it returns. The `⎕WC` that triggered injection is
therefore never handled before the component it needs is registered, and the
creating APL thread waits too - up to `EWC.PLUGIN_TIMEOUT` seconds, default
30, to allow for a first fetch of a large bundle. A failed injection is
logged with the plugin's name, and not retried until the next connection.

How the JavaScript arrives is the plugin's choice, not EWC's. The tidiest
form is a loader one-liner over a served resource:

```apl
 r←Inject
 r←'import(window.EWC.url("/globe/globe.js")).then(m => m.register(window.EWC))'
```

An ES module import gets browser caching and working sourcemaps, and none of
the code travels down the WebSocket as a string. Inlining the whole script in
`Inject`, or fetching a library from a CDN, work just as well, and mixing the
forms is normal - a plugin's own module from `/globe/`, the engine underneath
it from a CDN. Keeping `Inject` as a loader also means editing the JavaScript
never requires re-registering the plugin.

## The client side

The client is a React app with a fixed set of built-in components, plus a
registry for plugin ones. Injected code reaches it through `window.EWC`:

| Member | Purpose |
|--------|---------|
| `EWC.React` | The client's own React instance. Build your components with it - a plugin bundling a second React gives its hooks a different dispatcher, and they fail. |
| `EWC.registerComponent(type, entry)` | Adds a component to the registry under the class's `ClassName`. |
| `EWC.components` | The registry itself, by `Type`. |
| `EWC.url(path)` | Resolves a server path, such as a mounted resource, against the EWC server's origin. |

`entry` is the component function, or an object when there is more to say:

| Member | Purpose |
|--------|---------|
| `component` | The React component. Required. |
| `defaultProperties` | Client-side property defaults, merged under whatever `⎕WC` supplies. |
| `WS` | `(wsSend, data, current)` - take over handling of `⎕WS` for this class. |
| `WG` | `(wsSend, event, refData)` - take over handling of `⎕WG`. This is how a `Dynamic` property gets its value from the browser. |

The component is rendered as `({data, location, ewc})`:

- `data.ID` is the object's name, e.g. `'F1.G'`. Put it on your outermost
  element, since that is what `⎕WG` of `Posn` and `Size` measures.
- `data.Properties` holds the object's properties, defaults merged in.
- `ewc` is the client's render-time context: `ewc.utils` (including
  `setStyle`, which turns `Posn`/`Size`/`Visible` into CSS exactly as the
  built-in classes do), `ewc.hooks`, `ewc.SelectComponent` for rendering
  children, and `ewc.socket` for sending events.

## Events

An event is a message on `ewc.socket`, and a plugin class takes part in the
event loop exactly as a built-in one does:

```js
ewc.socket.send(JSON.stringify({
  Event: { EventName: 'click', ID: data.ID, Info: [code, name, value] },
}));
```

Only send events the application registered a callback for. Check
`data.Properties.Event` before wiring a handler, as the tutorial's component
does.

## Things to know

- **Drive plugin classes from application code.** EWC's cover functions
  (`eWC`, `eWS`, and so on) resolve object names like `'F1.G'` against the
  namespace that calls them. A convenience function living in the plugin's
  own namespace would resolve them against the plugin instead, so keep such
  wrappers in the application, or pass fully-resolved work to the plugin some
  other way.
- **One injection per connection.** Injection state is tracked per browser
  connection, so a reload re-injects but a second object of the same class
  does not. In Multi mode every user's client fetches the plugin's JavaScript
  for itself.
- **A plugin cannot be named `classes`.** The name is reserved inside EWC's
  plugin registry.
- **`Folder` is convention, not mechanism.** EWC never reads it. Derive your
  `Resources` paths from it in `Register` - the plugins' `Folder.aplf` shows
  how to find the package root under Link.
