# Button

The EWC implementation of [`⎕WC` class Button](https://help.dyalog.com/19.0/index.htm#GUI/Objects/Button.htm) has some degree of support for:

| Properties|  |  |  |
|--|--|--|--|
 |  [Active](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Active.htm)  |  [Caption](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Caption.htm)    |  [Posn](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Posn.htm)    |  [Visible](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Visible.htm) |
 |  [Align](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Align.htm)    |  [CssClass](https://help.dyalog.com/19.0/index.htm#GUI/Properties/CssClass.htm)  |  [Size](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Size.htm)    |                                                                               |
 |  [Attach](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Attach.htm)  |  [Event](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Event.htm)        |  [State](https://help.dyalog.com/19.0/index.htm#GUI/Properties/State.htm)  |                                                                               |
 |  [CSS](https://help.dyalog.com/19.0/index.htm#GUI/Properties/CSS.htm)        |  [Picture](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Picture.htm)    |  [Style](https://help.dyalog.com/19.0/index.htm#GUI/Properties/Style.htm)  |                                                                               |


| Events|  |  |  |
|--|--|--|--|
 |  [KeyPress](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/KeyPress.htm)    |  [MouseEnter](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/MouseEnter.htm)  |  [MouseMove](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/MouseMove.htm)  |  [Select](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/Select.htm)     |
 |  [MouseDown](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/MouseDown.htm)  |  [MouseLeave](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/MouseLeave.htm)  |  [MouseUp](https://help.dyalog.com/19.0/index.htm#GUI/MethodOrEvents/MouseUp.htm)      |                                                                                     |

NB: Links above are to the complete `⎕WC` documentation

## Known Limitations

The `Picture` property must refer to a file which resides in one of the folders
defined in the EWC.RESOURCES array. See [Images](../Usage/Configuration.md)
for more information.
