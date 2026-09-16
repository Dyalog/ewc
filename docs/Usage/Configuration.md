# Configuration

The `EWC` namespace contains a number of variables that can be used to 
configure the system.

## PORT

Sets the port number the server would like to use. Defaults to 22322. If that port
is busy, the server moves up to the next free one - see PORTTRIES. After `EWC.Init`
returns, `EWC.PORT` holds the port actually being served.

## PORTTRIES

How many consecutive ports EWC may try, starting at PORT. Defaults to 10, so a
server that wants 22322 will settle for anything up to 22331 - the same way Vite
steps from 5173 to 5174. This lets you start a second EWC session to try something
out without shutting down a long-running one.

The port in use is reported when it is not the one you asked for:

```
Port 22322 is already in use - starting on port 22323
```

Set `EWC.PORTTRIES←1` to insist on PORT; `EWC.Init` then signals an error rather
than moving elsewhere:

```
      EWC.PORTTRIES←1
      'e'EWC.Init 'browser'
Unable to start the EWC server: Port 22322 is already in use
```

## FOLDER

If EWC was loaded using `]Link.Create` on a machine with a file system watcher, EWC will be
able to determine the folder that it was loaded from. In other situations, you need
to set this variable so that EWC can locate the the demo application images, 
and the javascript client code. For example:

`EWC.FOLDER←'/git/ewc'`

## RESOURCES

Sets up virtual folders that contain images and other resources that your 
application might refer to. This is a 2-column matric containing pairs of virtual
folder names and real folders containing resource files. For example:

`EWC.RESOURCES←1 2⍴'images' '/tmp/myapp/images'`

This creates a virtual folder `/images/` that can be referred to when creating
ImageLists and other objects created from image files.

You can define as many resources as you like, one per row.

## FONTMAP

EWC includes a number of free fonts. FONTMAP is a font substitution table, which can
be used to map Windows font names used in existing applications to the free alternatives.
If FONTMAP is not specified, FONTMAP is initialised from FontMap. At the time this
text was written, FontMap was a 2-column matrix containing the following fonts:

|Legacy Font     | Free Font Substitute |
|----------------|----------------------|
|Segoe UI        | Merriweather         |                     
|Times New Roman | Noto Sans            |
|Courier New     | Nimbus Mono          | 

You can set

## LOGMODES

This variable allows you to control the log messages that are output to the session
while running EWC. At this stage in the development of EWC, all messages are output
for diagnostic purposes. By default, all message types are output (`EWC.LOGMODES←⎕A`). 
At the time that this text was written, the following modes existed:

- D: Debug
- E: Error
- F: Format Request
- W: Warning
- T: Transmit on WebSocket
- R: Receive on WebSocket
- C: Connect or Disconnect
- U: Unsupported feature
- N: Explicit NQ
- P: ProcessEvent
- G: WG processing

An up-to-date list can be found in the function `EWC.Log`.

## LOGFILE

When set to a file path, all log output is redirected to that file instead of
the APL session. Output is appended; the file is created if it does not exist.
Redirecting to a file can improve performance by avoiding session output.

```
EWC.LOGFILE←'/tmp/myapp.log'
```

Set to `''` to keep session output (the default):

```
EWC.LOGFILE←''
```

## For Developers

The following configuration settings are intended for use during development of EWC
itself:

## Dev server query parameters

A browser connected to an EWC server always talks back to the port it was served
from, so PORTTRIES needs no client-side setting. The Vite dev server (`yarn dev`)
is the exception: it serves the client itself, and reads the APL server's address
from `VITE_APL_URL`. To point it at a second EWC without editing `.env`, add
`?aplPort=` to the dev URL:

```
http://localhost:5173/?aplPort=22323
```

`?aplUrl=http://otherhost:22323/` does the same for a server on another host. Both
are ignored outside `yarn dev`.

## SHOWDEVTOOLS

If you set this to 1, EWC will call `ShowDevTools 1` on each HTMLRenderer that it creates.

## JSClientFolder

If you want to override EWC's efforts to locate a folder where the JavaScript client
code resides, you can set this variable to point to a specific folder. This is only
useful if you are either a developer or on the bleeding edge of client development,
and need to switch between versions of the client.

If this variable is not set, EWC uses the client in the `client/dist` folder within the
EWC folder - which is where `yarn build` writes it, and where a release download
already has one.

Earlier versions also probed for a sibling `ewc-client` checkout. That is gone: the
client now lives in this repository, and a leftover sibling folder would silently
shadow this repository's own build.