Esc::
BreakLoop = 1
return

^j::
BreakLoop = 0
send, {LWin down}
sleep, 400
send, {r down}
sleep, 120
send, {r up}
sleep, 120
send, {LWin up}
sleep, 120
sendinput, mspaint
sleep, 120
send, {Return down}
sleep, 60
send, {Return up}
sleep, 1000
send, {Alt down}
sleep, 120
send, {Tab down}
sleep, 120
send, {Tab up}
sleep, 120
send, {Alt up}
sleep, 300
Loop, 153
{
	if (BreakLoop = 1)
	{
		MsgBox, Manual exit
		Return
	}
	send, !{PrintScreen}
	sleep, 100
	send, {Alt down}
	sleep, 120
	send, {Tab down}
	sleep, 120
	send, {Tab up}
	sleep, 120
	send, {Alt up}
	sleep, 300
	send, {LCtrl down}
	sleep, 120
	send, {v down}
	sleep, 100
	send, {v up}
	sleep, 120
	send, {LCtrl up}
	sleep, 120
	send, {F12 down}
	sleep, 50
	send, {F12 up}
	sleep, 400
	if (BreakLoop = 1)
	{
		MsgBox, Manual exit
		Return
	}
	sendinput, i
	sendinput, m
	sleep, 10
	sendinput, g
	sleep, 10
	sendinput, %A_Index%
	sleep, 40
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
	sleep, 120
	send, {Alt down}
	sleep, 120
	send, {Tab down}
	sleep, 120
	send, {Tab up}
	sleep, 120
	send, {Alt up}
	sleep, 300
	send, {s down}{s up}
	sleep, 100
	if (BreakLoop = 1)
	{
		MsgBox, Manual exit
		Return
	}
}
MsgBox, Finished
Return