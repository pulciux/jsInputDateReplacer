# jsInputDateReplacer
**a simple fall-back replacer for HTML5 input date when not supported by the browser**


HTML5 date inputs aren't widely supported by web browsers.
Eg: Google Chrome fully supports date inputs, Mozilla Firefox doesn't (at least Firefox for desktop doesn't).

This is a simple solution that helps you to keep your code clean.
Just add an identifier to your input date field and intiate it calling ``setDateField([field-identifier]);``

If the browser supports it natively the original one will be kept, otherwise a replacement will be loaded.


* click on a fragment to move the focus on it
* automatically jumps to the next fragment
* increase/decrease the fragment content with up and down arrow keys
* backspace and delete to clear the active fragment
