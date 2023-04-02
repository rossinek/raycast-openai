use framework "Cocoa"
use scripting additions

global ca
set ca to current application

to isModifierPressed(modifier)
    ((ca's NSEvent's modifierFlags()) / modifier as integer) mod 2 is equal to 1
end isModifierPressed

-- wait until all modifiers except "cmd" are released
-- it's important if the script is executed with a shortcut
-- for "cmd + c" to have a desired effect
repeat while isModifierPressed(ca's NSEventModifierFlagShift) or isModifierPressed(ca's NSEventModifierFlagControl) or isModifierPressed(ca's NSEventModifierFlagOption)
    delay 0.1
end repeat

tell application "System Events"
  keystroke "c" using command down
end tell
