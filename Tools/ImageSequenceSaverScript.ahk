Esc::
BreakLoop = 1
return

^j::
BreakLoop = 0
Loop, 110
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
   send, {s down}
   sleep, 80
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
   Sleep, 160
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
   Sleep, 140
   send, {s up}
   Sleep, 100
   if (BreakLoop = 1)
   {
      MsgBox, Manual exit
      Return
   } 
}
MsgBox, Finished
Return