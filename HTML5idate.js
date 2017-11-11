/** it replaces, if not supported, an HTML5 intput date with an emulation of it
 * 
 * @param {string} elmId - id of the input date
 * @returns {Boolean}
 */
function setDateField(elmId) {
    try {
        var elmField = document.querySelector('#' + elmId); //get the element

        if (typeof elmField != 'undefined') {                        //check element availability
            var typeField = elmField.getAttribute('type');           //current input date type
            var origDate = new Date(elmField.value);                 //original date
            var fragTabIndex = elmField.tabIndex;                    //initial tabIndex for fragments
            var ckCap = document.createElement('input');             //input element used to check browser capabilities
            var ckCapWrongValue = 'not-a-date';                      //a wrong date value for ckCap
            var elm = document.createElement('div');                 //create a fragments container element
            elm.fragements = {};                                     //initialize fragments (day, month,...)
            elm.currentFragFocus = null;                             //fragment currently focused

            /** Try to figure out if date input type is supported by the browser */
            ckCap.setAttribute('type', 'date');
            ckCap.setAttribute('value', ckCapWrongValue);
            if (ckCap.value !== ckCapWrongValue && (typeField == 'date' || typeField == 'datetime-local'))      //if supported
                return true;                                         //no need replacing native input
            else
                delete ckCap;
            
            /** when the fragments container gets focus */
            elm.addEventListener('click', function (e) {
                if (elm.currentFragFocus !== null)              //if there is an already focused fragment
                    elm.currentFragFocus.focus();               //moves the focus to it
                else
                    this.fragements[Object.keys(this.fragements)[0]].focus(); //if not, it moves the focus to the first fragment
            }, true);

            /** initialize a data fragment */
            elm.initFragment = function (fName, placeHolder, sep, min, max, origVal) {
                var frag = this.fragements[fName] = document.createElement("span");     //new node for fragment
                
                //connect previous fragment with the current one
                if (typeof this.prevFragment !== 'undefined') {
                    this.prevFragment.nextFragment = frag;
                }
                this.prevFragment = frag;
                
                /** it updates the fragment textual value shown with padded numbers (or a placeholder if empty) */
                frag.updContent = function () {
                    this.innerHTML = (this.value === null ? this.placeHolder : Array(Math.min(this.max.toString().length, this.placeHolder.length) - String(this.value).length + 1).join('0') + this.value);
                };
                
                /** it sets the fragment numeric value  */
                frag.updValue = function (newVal) {
                    var oldVal = this.value;
                    if (newVal === null || (newVal >= this.min && newVal <= this.max)) {
                        this.value = newVal;
                        this.updContent();
                        return (oldVal !== this.value);
                    } else
                        return false;
                };
                
                /** initialize parameters */
                frag.placeHolder = placeHolder;                     //placeholder for empty fragment
                frag.min = min;                                     //minimal accepted value
                frag.max = max;                                     //maximum accepted value
                frag.value = origVal;                               //initial fragment value
                frag.setAttribute("tabindex", fragTabIndex);        //makes the fragment a focus receiver
                frag.tCursor = 0;                                   //initial text cursor position
                frag.updContent();                                  //update fragment textual value

                /** when the fragment get focused */
                frag.addEventListener('focus', function (e) {
                    e.stopPropagation();                            //don't pass the focus to the fragment container
                    elm.currentFragFocus = this;                    //remembers it's the currently focused fragment
                    this.tCursor = 0;                               //sets text cursor initial position to 0                    
                }, true);
                
                /** when the fragment lost focus */
                frag.addEventListener('blur', function (e) {
                    elm.currentFragFocus = null;                    //no currently focused fragment

                    /** after 100ms checks if none of the fragments still focused. 
                     * If not, it updates the field value ed if necessary it triggers onChage event */
                    setTimeout(function () {
                        if (elm.currentFragFocus === null) {
                            var curDataValue = elmField.value;
                            
                            //a string representation of the date-time
                            var vStringDate = '';
                            if (typeField === 'date' || typeField === 'datetime' || typeField === 'datetime-local')
                                vStringDate = elm.fragements.year.value + '-' + elm.fragements.month.value + '-' + elm.fragements.day.value;
                            if (typeField === 'datetime' || typeField === 'datetime-local')
                                vStringDate += ' ' + elm.fragements.hours.value + '-' + elm.fragements.minutes.value + '-' + elm.fragements.seconds.value;
                            var vDate = new Date(vStringDate);      //makes a date from its textual representation
                            if (isNaN(vDate))                       //if it wasn't a valid date
                                elmField.value = '';                //set the input element value as an empty string
                            else {
                                if (typeField == 'date' || typeField == 'datetime' || typeField == 'datetime-local') {  //if the input element is represents a date at least
                                    elm.fragements.day.updValue(vDate.getDate());           //set all the date fragments with the parsed date
                                    elm.fragements.month.updValue(vDate.getMonth() + 1);
                                    elm.fragements.year.updValue(vDate.getFullYear());
                                    elmField.value = elm.fragements.year.innerHTML + '-' + elm.fragements.month.innerHTML + '-' + elm.fragements.day.innerHTML; //set the new date into the original field
                                }
                                if (typeField == 'datetime' || typeField == 'datetime-local') {  //if the input element represents a time (even a time)
                                    elm.fragements.hours.updValue(vDate.getHours());           //set all the time fragments with the parsed one
                                    elm.fragements.minutes.updValue(vDate.getMinutes());
                                    elm.fragements.seconds.updValue(vDate.getSeconds());
                                    elmField.value += ' ' + elm.fragements.huors.innerHTML + ':' + elm.fragements.minutes.innerHTML + ':' + elm.fragements.seconds.innerHTML; //set the new time into the original field
                                }
                            }
                            if (elmField.value !== curDataValue)    //is the date has changed
                                elmField.onchange();                //triggers the onChange event of the original field
                        }
                    }, 100);
                }, true);

                /** capture special keys and do something */
                frag.addEventListener('keydown', function (e) {
                    var key = e.which || e.keyCode;
                    switch (key) {
                        case 8:                     //backspace
                        case 46:                    //delete
                            this.updValue(null);    //clears the fragment
                            e.preventDefault();
                            break;
                        case 38:            //up harrow
                            this.updValue(this.value + 1);  //increments the fragment
                            e.preventDefault();
                            break;
                        case 40:            //down harrow
                            this.updValue(this.value - 1);  //decrements the fragment
                            e.preventDefault();
                            break;
                    }
                }, true);

                /** when the fragment receives a pressed key */
                frag.addEventListener('keypress', function (e) {
                    var char = String.fromCharCode(e.which || e.keyCode);       //gets the input char
                    if (char >= '0' && char <= '9') {                           //and checks if it's a digit
                        var tVal = ((this.value === null || this.tCursor === 0) ? '' : this.innerHTML.slice(this.tCursor * -1)); //current textual value according to cursor position
                        var newVal = parseInt(tVal + char);                         //new value attaching the new digit
                        if (this.updValue(newVal)) {                                //if it's a valid value
                            if ((this.max.toString().length - 1) > this.tCursor)    //move the cursor if still under the max lenght
                                this.tCursor += 1;
                            var testValue = this.value.toString() + '0';            //check the if the next magnitude is greater then the max value, skip to the next fragment
                            if (typeof this.nextFragment !== 'undefined' && (this.value.toString() + '0') > this.max) // if attaching another char will certainly lead to a numeber greater the the max
                                this.nextFragment.focus();                          //jumps to the next fragment (if any)
                        }
                    }
                }, true);
                
                this.appendChild(frag);                                             //appends the fragment to the main node
                if (typeof sep === "string")                                        //and adds a fragment separator if required
                    this.appendChild(document.createTextNode(sep));
            };


            //initialize date-time fragments
            if (typeField === 'date' || typeField === 'datetime' || typeField === 'datetime-local') {
                elm.initFragment('day', 'gg', '/', 1, 31, (isNaN(origDate) ? null : origDate.getDate()));
                elm.initFragment('month', 'mm', '/', 1, 12, (isNaN(origDate) ? null : origDate.getMonth() + 1));
                elm.initFragment('year', 'aaaa', ' ', 0, 9999, (isNaN(origDate) ? null : origDate.getFullYear()));
            }
            if (typeField === 'datetime' || typeField === 'datetime-local') {
                elm.initFragment('hours', '--', ':', 0, 23, (isNaN(origDate) ? null : origDate.getHours()));
                elm.initFragment('minutes', '--', ' ', 0, 59, (isNaN(origDate) ? null : origDate.getMinutes()));
                elm.initFragment('seconds', '--', null, 0, 59, (isNaN(origDate) ? null : origDate.getSeconds()));
            }


            elmField.parentNode.replaceChild(elm, elmField);                    //replace native input with the emulated one
            elm.appendChild(elmField);                                          //and put the original one at the tail
            if (elmField.getAttribute('class'))                                 //copy class if any
                elm.setAttribute('class', elmField.getAttribute('class'));
            if (elmField.getAttribute('style')) {                               //copy style (if any) and hide the original field
                elm.setAttribute('style', elmField.getAttribute('style'));
                elmField.style.display = 'none';
            } else {
                elmField.setAttribute('style', 'display: none;');
            }
        }
    } catch (err) {
        console.log('DateField: ' + err.message);
    }
}
