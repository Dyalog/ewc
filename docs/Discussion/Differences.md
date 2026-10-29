# `EWC` versus `⎕WC`

Most importantly, `EWC` only supports a subset of the objects supported by
`⎕WC` - and for each of the supported classes, only a subset of the features of
the class. 

If you use an unsupported class or property, EWC reports it and continues, in the
hope that your application will work in a degraded mode. The report identifies the
line of application code that asked for it. For example:

`31:00.089 U:  Unsupported on eWC: Button property FCol on "F1.B" at BuildPanel[1] MakeForm[2]. Please write to support@dyalog.com if you want this soon.`

Every such report is also appended to `EWC.UNSUPPORTEDLOG` (`ewc-unsupported.log` by
default). That file holds nothing else, so the practical way to migrate an application
is to exercise it, then send the file to support@dyalog.com - it is a list of exactly
what your application needs and nowhere else to look for it.

If you would rather stop on each one, set `EWC.UNSUPPORTED←2` and EWC signals a
`DOMAIN ERROR` in your own function instead. `EWC.UNSUPPORTED←0` silences the reports
altogether. See [Configuration](../Usage/Configuration.md) for the detail.

You can decide to ignore a report, work around it, or request support for the
missing feature from Dyalog. For more information, see the documentation of [supported classes](../ObjectRef/Classes.md).

# Validation and Error Messages

Property validation and error messages are not as reliable as `⎕WC` and `⎕WS`. 
If you provide incorrect property values, the results can be unpredictable:
the property may simply be ignored, in the worst case the form will be blanked
out due to the creation of invalid HTML.

# Implicit Interactive `⎕DQ`

This is supported, but considered experimental. The implementation uses a 
Timer object called _EWC.EWCTIMER within the application namespace.

# Images and ImageLists

Images are handled differently - all images must be made defined by image files
that can be loaded by a web browser. See [Images](Images.md) for details.

# Temporary Limitations

The following restrictions are temporary and will be relaxed before the first
supported release:

 * Coord must be (and defaults to) "Pixel"

 * Setting properties must be done using ⎕WC and ⎕WS, assignment is not supported. 
 
 * Up-to-date property values must be retrieved using ⎕WG. Although a namespace
   is created for each EWC object, and there are variables in these spaces that
   correspond to the properties of GUI objects, these values are not kept up-to-date
   when the user manipulates the GUI.
  
