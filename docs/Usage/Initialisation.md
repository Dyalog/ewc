# Initialising an EWC session

Once you have a folder on your machine containing EWC, you can load it into a Dyalog APL session (18.2 or later is required):

`]link.import # /path/to/ewc`

Where `/path/to/ewc` is the name of the folder that you created during [installation](Installation.md).

# EWC.Init

The function EWC.Init takes a right argument of the mode that you want to 
enable: 

* 'Desktop' to run each form in an HTMLRenderer
* 'Browser' to allow a single session from a browser
* 'Multi' to allow multiple sessions from browsers (more about that later)

For example:

`EWC.Init 'Desktop'`

`EWC.Init` will also create `eWC`, `eWS` and so on, in the
namespace from which Init was called. These are EWC's workalikes for the system
functions `⎕WC`, `⎕WS`, etc. - they reimplement the same interface rather than
wrapping it, and are intended to be used in their place.

If you would like to use a different prefix letter for these functions, you can 
provide a left argument to change the names. For example:

`'x' EWC.Init 'Browser'`

Will create functions `xWC`, `xWS` etc, and start EWC in Browser mode.

## eNEW: migrating ⎕NEW code

`eNEW` is the workalike for creating GUI objects with `⎕NEW`. It returns a
reference to an unnamed object, and every EWC object also contains `eNEW`, so
children are created by calling it inside the parent, exactly as with `⎕NEW`:

```apl
f←eNEW'Form'(⊂'Caption' 'Hello World')
b←f.eNEW'Button'(('Caption' 'Press Me')('Event'('onSelect' 'Pressed')))
f.(L←eNEW⊂'Label')
```

Existing `⎕NEW` GUI code should run after renaming `⎕NEW`→`eNEW` (and `⎕WS`, `⎕WG`,
`⎕NQ`, `⎕DQ`, `⎕EX`, `⎕WN` to their e-equivalents, which accept refs). As with
`⎕NEW`, a callback registered with the *onEvent* syntax receives a ref to the
object, and `'onSelect'` as the event name. Property assignment and reference
(`f.Caption←'New'`) works as for `eWC` objects.

Differences from `⎕NEW`:

* The client needs a name for every object, so `eNEW` gives each one a hidden
  name such as `_Form1` or `_Form1._Button1`, which is visible in `⍕f`, `⎕NL` and
  the browser.
* An `eNEW` object is not removed when its last reference goes away (so `⎕EX'f'`
  does not close a form). Use `eEX f`, or close the Form.
* Methods cannot yet be called as functions (`f.Wait`): use `eDQ f` or `eNQ`.
* GUI base classes (`:Class MyForm:'Form'`) are not supported.

## EWC.NOIDQ

If you want to experiment interactively, rather than call `eDQ`, you must set
`EWC.NOIDQ←0` to allow "Interactive DQ" (apologies for the negative switch name) before creating objects.
This will probably change soon.

# 'Multi' Mode

In Desktop and Browser mode, your application can call EWC.Init and then immediately
continue to create GUI components using `eWC`. In browser mode, EWC.Init will not
return until a browser is connected.

However, in Multi mode, your application namespace must contain a 
function called `Initialise` which will be called when each new browser session starts,
to create the GUI for the new session.

If your application namespace contains a function called `onClose`, then it will be 
called when the browser session is terminated.

Note that in Multi mode, the only permitted prefix is 'e'.