 r←{l}iEvaluate args;z;m;v;a;i;n;o;this;exec;dot;d;e;f;caller;name;p;wgid;msg;conn;t;id;⎕TRAP;set;index;indexed;data;ixexpr;sub
⍝ Missing support for onEvent←
⍝         and Method invocation

 ⍝ ⎕TRAP←0 'S'
 exec←{0=≢⍺:⍎⍵
     a←⍎⍺
     1=≢a:a⍎⍵
     a⍎¨⊂⍵}

 (set indexed ixexpr)←0 0 ''
 :If 4=≢args
     data←4⊃args
     :If indexed←9=⎕NC'data' ⍝ PropertyArguments - indexed
     :AndIf indexed←'#.[PropertyArguments]'≡⍕data
         index←data
         ixexpr←'[',(1↓∊';',¨data.IndexersSpecified\⍕¨data.Indexers),']'
         :If set←2=⎕NC'data.NewValue'
             data←data.NewValue
         :EndIf
     :Else
         set←1
     :EndIf

 :EndIf

 a←⊃args    ⍝ Names
 o←''       ⍝ Can be resolved in this space
 :If ~this←(≢a)<i←a⍳'.' ⍝ If there is a dot /// This is too simple
     sub←{(+/∧\' '=⌽⍵)↓⌽⍵}⍣2⊢i↓a
     :If ¯1=⎕NC{(+/∧\' '=⌽⍵)↓⌽⍵}⍣2⊢(i-1)↑a ⍝ Not name.something, e.g. B←eNEW'Button'#.(pos cap ev)
         this←1
     :ElseIf (~'.'∊sub)∧(')('≡2↑¯1⌽sub)∨¯1≠⎕NC sub ⍝ Just a parenthesised expression w/out dots
     :AndIf ~¯1∊⎕NC(~¯1↓sub∊'( ')⊆¯1↓sub ⍝ No invalid names
         this←1                  ⍝ We can do it here after all
     :Else ⍝ We need to drill down
         o←(i-1)↑a ⋄ a←i↓a
     :EndIf
 :EndIf
 n←' '(≠⊆⊢)a~'()'

 :If 3=2⊃args       ⍝ Function - currently monadic only
     :Select 3⊃args
     :Case 32
         r←o exec a
     :Caselist 52 60 ⍝ Function
         f←⍎(0=≢o)↓'o⍎a'
         :If 4=≢args
             :If 2=⎕NC 'l'
                 r←l f 4⊃args
             :Else
                 r←f 4⊃args
             :EndIf
         :Else
             r←f
         :EndIf
     :Else
         ...
     :EndSelect
     →0
 :EndIf

 :If ~set        ⍝ Get
     :If 0<≢o       ⍝ Keep going down the rabbit hole
         r←⍎⊃args
     :Else          ⍝ We are at the bottom
         :If 2=⎕NC'Dynamic'
         :AndIf ∨/m←n∊Dynamic ⍝ Need to ask client for an update
             caller←#.EWC.findTop_EWC name←EWC.refName ⎕THIS ⍝ not ⍕: eNEW objects have a ⎕DF
             name←⊃caller EWC.removeCaller name
             (id conn)←EWC.getConnection caller name
             (wgid msg)←EWC.sendWGmsg conn name(d←m/n)
             :Trap 6
                 v←msg EWC.WaitForWG d id wgid
                 o exec'(',(⍕d),')←',(1≠≢d)↓'⊃v'
             :Else ⍝ Client failed to respond
                 :If d≡,⊂'Size'
                     'E' EWC.Log '*** WG ''Size'' failed to return a result ***'
                     ⍝ Fall through and use "static" value
                 :Else
                     →0 ⊣ ⎕ex 'r' ⍝ Do not return a result
                 :EndIf
             :EndTrap
         :EndIf
         r←o exec a,ixexpr
     :EndIf
 :Else              ⍝ Set
     :Trap 6
         r←o exec a,ixexpr      ⍝ Values before updates
     :Else
         r←(≢n)⍴⊂⍬
     :EndTrap

     :Trap 0
         dot←(0≠≢o)/'.'
         m←' '∊a
         e←(⍕o),dot,(m/'('),a,ixexpr,(m/')'),'←data'   ⍝ Set the variables
         ⍎e
         :If ∨/m←(2↑¨n)∊⊂'on'
         :AndIf ∨/m←((2×m)↓¨n)∊EventList     ⍝ onEvent...
             Event←EWC.updateEvent (t←Event) (m/n) (,⊂m/⊆d)
             n,←(t≢Event)/⊂'Event'           ⍝ Add Event to list
         :EndIf
     :Else
         ...
     :EndTrap

     :If 0=≢o              ⍝ We are at the bottom
     :AndIf ∨/m←n∊PropList ⍝ Need to communicate changes to client
         :Trap 0
             n←m/n
             caller←#.EWC.findTop_EWC name←EWC.refName ⎕THIS ⍝ not ⍕: eNEW objects have a ⎕DF
             name←⊃caller EWC.removeCaller name
             v←o exec(',⊂'/⍨1=≢n),⍕n
             :If (≢v)≥i←n⍳⊂'Event'
                v[i]←⊂EWC.removeOn i⊃v
             :EndIf
             caller EWC.sendWSns EWC.makeWSns name n v
         :Else
             ...
         :EndTrap
     :EndIf
 :EndIf
