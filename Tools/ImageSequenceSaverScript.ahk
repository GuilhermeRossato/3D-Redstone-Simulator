Esc::
BreakLoop = 1
return

^j::
BreakLoop = 0
Loop, 176
{
   Sleep, 160
   send, {AppsKey down}
   sleep, 160
   send, {AppsKey up}
   Sleep, 160
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   }
   sleep, 20
   send, {s down}
   sleep, 100
   send, {s up}
   WinWaitActive, Salvar como, , 6
   if ErrorLevel
   {
      MsgBox, WinWait timed out
      Return
   }
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   }
   Sleep, 140
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   } 
   Sleep, 150
   sendinput, i
   sendinput, m
   Sleep, 10
   sendinput, g
   Sleep, 10
   sendinput, %A_Index%
   Sleep, 40
   send, {NumpadEnter down}{NumpadEnter up}
   WinWaitClose
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   } 
   if ErrorLevel
   {
      MsgBox, WinWaitClose timed out
      Return
   }
   Sleep, 160
   send, {s down}
   Sleep, 160
   send, {s up}
   Sleep, 120
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   } 
}
MsgBox, Finished
Return