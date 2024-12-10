/*
Copyright (c) 2024 Tamás Dezső (asdf.hu)
https://github.com/xsnpdngv/ASDF-V

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
“Software”), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


(function() { // Immediately Invoked Function Expression (IIFE)
              // to not pullute the global namespace


/* ====================================================================
 * Auxiliary classes to support storing some data persistently in
 * the browser's local storage
 * ==================================================================== */
class PersistentSet {
    constructor(key) {
        this.key = key;
        this.set = this.#loadSetFromLocalStorage(key);
    }

    add(value) {
        this.set.add(value);
        this.#saveSetToLocalStorage(this.key, this.set);
    }

    delete(value) {
        this.set.delete(value);
        this.#saveSetToLocalStorage(this.key, this.set);
    }

    has(value) {
        return this.set.has(value);
    }

    clear() {
        this.set.clear();
        this.#saveSetToLocalStorage(this.key, this.set);
    }

    values() {
        return [...this.set];
    }

    forEach(callback, thisArg = undefined) {
        // Call the callback for each element in the set
        this.set.forEach(callback, thisArg);
    }

    #saveSetToLocalStorage(key, set) {
        localStorage.setItem(key, JSON.stringify([...set]));
    }

    #loadSetFromLocalStorage(key) {
        const data = localStorage.getItem(key);
        return data ? new Set(JSON.parse(data)) : new Set();
    }
}


class PersistentArray {
    constructor(key) {
        this.key = key;
        this.array = this.#loadArrayFromLocalStorage();
    }

    #loadArrayFromLocalStorage() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    #saveArrayToLocalStorage() {
        localStorage.setItem(this.key, JSON.stringify(this.array));
    }

    add(value) {
        this.array.push(value);
        this.#saveArrayToLocalStorage();
    }

    remove(index) {
        if (index >= 0 && index < this.array.length) {
            this.array.splice(index, 1);
            this.#saveArrayToLocalStorage();
        }
    }

    setArray(newArray) {
        if (Array.isArray(newArray)) {
            this.array = newArray;
            this.#saveArrayToLocalStorage();
        }
    }

    getArray() {
        return this.array;
    }

    get(index) {
        return this.array[index];
    }

    length() {
        return this.array.length;
    }

    move(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.array.length && toIndex >= 0 && toIndex < this.array.length) {
            const [item] = this.array.splice(fromIndex, 1); // Remove item from original position
            this.array.splice(toIndex, 0, item); // Insert item at the new position
            this.#saveArrayToLocalStorage();
        }
    }

    moveToStart(index) {
        if (index >= 0 && index < this.array.length) {
            const [item] = this.array.splice(index, 1); // Remove item
            this.array.unshift(item); // Insert at the start
            this.#saveArrayToLocalStorage();
        }
    }

    moveToEnd(index) {
        if (index >= 0 && index < this.array.length) {
            const [item] = this.array.splice(index, 1); // Remove item
            this.array.push(item); // Insert at the end
            this.#saveArrayToLocalStorage();
        }
    }

    getAll() {
        return this.array;
    }

    set(index, value) {
        if (index >= 0 && index < this.array.length) {
            this.array[index] = value;
            this.#saveArrayToLocalStorage();
        }
    }

    clear() {
        this.array = [];
        this.#saveArrayToLocalStorage();
    }
}


class PersistentBool {
    constructor(key, defaultValue = false) {
        this.key = key;
        if (localStorage.getItem(this.key) === null) {
            this.value = defaultValue;
            this.#save();
        }
    }

    #save() {
        localStorage.setItem(this.key, JSON.stringify(this.value));
    }

    get() {
        return JSON.parse(localStorage.getItem(this.key));
    }

    set(value) {
        if (typeof value !== "boolean") {
            throw new Error("PersistentBool can only store boolean values.");
        }
        this.value = value;
        this.#save();
    }

    toggle() {
        this.set(!this.get());
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}


class PersistentString {
    constructor(key, defaultValue = "") {
        this.key = key;
        if (localStorage.getItem(this.key) === null) {
            this.value = defaultValue;
            this.#save();
        } else {
            this.value = localStorage.getItem(this.key);
        }
    }

    #save() {
        localStorage.setItem(this.key, this.value);
    }

    get() {
        return localStorage.getItem(this.key);
    }

    set(newValue) {
        if (typeof newValue !== "string") {
            throw new Error("PersistentString can only store string values.");
        }
        this.value = newValue;
        this.#save();
    }

    append(extraString) {
        if (typeof extraString !== "string") {
            throw new Error("Can only append string values.");
        }
        this.value += extraString;
        this.#save();
    }

    clear() {
        this.value = "";
        this.#save();
    }

    length() {
        return this.value.length;
    }
}


class PersistentInt {
    constructor(key, defaultValue = 0) {
        this.key = key;
        // Initialize with default value if not present in localStorage
        if (localStorage.getItem(this.key) === null) {
            this.value = defaultValue;
            this.#save();
        } else {
            this.value = this.#load();
        }
    }

    #save() {
        localStorage.setItem(this.key, JSON.stringify(this.value));
    }

    #load() {
        return parseInt(localStorage.getItem(this.key), 10);
    }

    get() {
        return this.#load();
    }

    set(newValue) {
        if (!Number.isInteger(newValue)) {
            throw new Error("PersistentInt can only store integer values.");
        }
        this.value = newValue;
        this.#save();
    }

    increment(amount = 1) {
        this.set(this.get() + amount);
    }

    decrement(amount = 1) {
        this.set(this.get() - amount);
    }

    clear(defaultValue = 0) {
        this.set
    }

    add(value) {
        if (!Number.isInteger(value)) {
            throw new Error("Can only add integer values.");
        }
        this.set(this.get() + value);
    }

    subtract(value) {
        if (!Number.isInteger(value)) {
            throw new Error("Can only subtract integer values.");
        }
        this.set(this.get() - value);
    }
}


class PersistentToggle {
    constructor(uiElemId, defaultValue, onChangeHandler, onChangeArg) {
        this.uiElemId = uiElemId;
        this.value = new PersistentBool(this.uiElemId, defaultValue);
        this.onChangeHandler = onChangeHandler;
        this.onChangeArg = onChangeArg;

        this.uiElem = document.getElementById(this.uiElemId);
        this.uiElem.checked = this.value.get();
        this.uiElem.onchange = () => this.toggle(this.uiElem.checked);
    }

    toggle(isOn) {
        this.value.set(isOn);
        this.uiElem.checked = isOn;
        this.onChangeHandler(this.onChangeArg, isOn);
    }

    reset() {
        this.toggle(false);
    }
}


/* ====================================================================
 * ASDF-V implements the Model-View-ViewModel (MVVM) pattern
 *
 * View:      index.html    - Structure and layout of UI
 *            asdf.css      - Appearance of UI elements
 * ViewModel: AsdfViewModel - Intermediary, coordinates the View's
 *                            interactions with the Model, updates
 *                            both the Model and the View
 * Model:     AsdfModel     - Non-visual, the data model and business
 *                            logic of the application
 * ==================================================================== */


/* ================================
 * Model: Data and Business Logic
 * ================================ */
class AsdfModel {
    constructor() {
        this.fileName = new PersistentString("fileName", "");
        this.fileSize = new PersistentInt("fileSize", 0);
        this.fileLastMod = new PersistentString("fileLastMod", "");
        this.diagSrcPreamble = new PersistentString("diagSrcPreamble", "");
        this.diagSrc = new PersistentString("diagTxt");
        this.diag = null;
        this.filteredActors = new PersistentSet("filteredActors");
        this.actorOrder = new PersistentArray("actorOrder");
        this.isShowIds = false;
        this.observers = [];
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    #notify() {
        this.observers.forEach(observer => observer.update());
    }

    init(isShowIds = false) {
        this.isShowIds = isShowIds;
        this.loadDiagramFromSrc();
    }

    clear() {
        this.file = null;
        this.diagSrc.set("");
        this.diag = null;
        this.reset();
    }

    reset() {
        this.diagSrcPreamble.set("");
        this.filteredActors.clear();
        this.isShowIds = false;
        this.loadDiagramFromSrc();
    }

    loadDiagramFromFile(file) {
        let model = this;

        model.fileName.set(file.name);
        model.fileSize.set(file.size);
        const lastMod = new Date(file.lastModified);
        const shortTime = lastMod.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        model.fileLastMod.set(lastMod.getFullYear() + '-' + (lastMod.getMonth()+1) + '-' + lastMod.getDate() + ' ' + shortTime);

        const reader = new FileReader();
        reader.onload = function(e) {
            model.diagSrc.set(e.target.result);
            model.loadDiagramFromSrc();
        };
        reader.readAsText(file);
    }

    loadDiagramFromSrc() {
        if (this.diagSrc.length() > 0) {
            this.diag = Diagram.parse(this.diagSrc.get());
            if (this.#arraysHaveSameElements(this.actorOrder.getArray(), this.diag.actors.map(element => element.name))) {
                let src = [this.diagSrcPreamble.get(), this.diagSrc.get()].join('\n\n');
                this.diag = Diagram.parse(src);
            }
            this.#postProcActors();
            if (this.isShowIds) {
                this.includeIdsInSignalMsgs(this.isShowIds, false);
            }
        }
        this.#notify();
    }

    includeIdsInSignalMsgs(isOn, isToNotify = true) {
        this.isShowIds = isOn;
        if ( ! this.diag) { return; }
        if (isOn) {
            this.diag.signals.forEach(s => {
                if (s.addinfoHead.srcInstanceId) {
                    s.message += '\n' + s.addinfoHead.srcInstanceId;
                }
            });
        } else {
            this.diag.signals.forEach(s => {
                if (s.addinfoHead.srcInstanceId) {
                    s.message = s.message.slice(0, s.message.length - s.addinfoHead.srcInstanceId.length - 1/*'\n'*/);
                }
            });
        }
        if (isToNotify) {
            this.#notify();
        }
    }

    toggleActor(index) {
        let a = this.diag.actors[index];
        if (this.filteredActors.has(a.name)) {
            this.filteredActors.delete(a.name);
            this.loadDiagramFromSrc();
        } else {
            this.filteredActors.add(a.name);
            this.#postProcActors();
            this.#notify();
        }
    }

    setActorOrder(actorOrder) {
        this.actorOrder.setArray(actorOrder);
        this.#setPreamble( this.#printArrayElementsAsParticipants(this.actorOrder.getArray()) );
    }

    #postProcActors() {
        this.#removeSignalsOfFilteredActors();
        this.diag.actors.forEach(a => { a.signalCount = 0; });
        this.diag.signals.forEach(s => {
            if (s.type === 'Signal') {
                s.actorA.signalCount++;
                s.actorB.signalCount++;
            } else if (s.type === 'Note') {
                s.actor.signalCount++;
            }
        });
    }

    #printArrayElementsAsParticipants(array) {
        return array.map(item => `participant ${item}`).join('\n');
    }

    #setPreamble(preamble) {
        this.diagSrcPreamble.set(preamble);
        this.loadDiagramFromSrc();
    }

    #removeSignalsOfFilteredActors() {
        let s;
        for (let i = this.diag.signals.length - 1; i >= 0; i--) {
            s = this.diag.signals[i];
            if ((s.type === 'Signal' && (this.filteredActors.has(s.actorA.name) ||
                                         this.filteredActors.has(s.actorB.name))) ||
                (s.type === 'Note' && this.filteredActors.has(s.actor.name))) {
                 this.diag.signals.splice(i, 1);
            }
        }
    }

    #arraysHaveSameElements(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        if (set1.size !== set2.size) return false;
        for (let elem of set1) {
            if ( ! set2.has(elem)) return false;
        }
        return true;
    }
}


/* ==============================
 * View Model: UI and Rendering
 * ============================== */
class AsdfViewModel  {
    constructor(model) {
        this.model = model;
        this.model.subscribe(this);
        this.isResizing = false;

        // toolbar
        this.fileInput = document.getElementById("fileInput");
        this.fileInputLabel = document.getElementById("fileInputLabel");
        this.toggles = {
            "showIds": new PersistentToggle("showIdsToggle", false, this.#showIdsOnChange, this),
            "showInstance": new PersistentToggle("showInstanceToggle", false, this.#markSignalsHandler, this),
            "showRelated": new PersistentToggle("showRelatedToggle", false, this.#markSignalsHandler, this)
        }

        // placeholders
        this.diagramHeadContainer = document.getElementById("diagramHeadContainer");
        this.diagramHeadDiv = document.getElementById("diagramHead");
        this.diagramContainer = document.getElementById("diagramContainer");
        this.diagramDiv = document.getElementById("diagram");

        // view state
        this.clickedSignalSeqNum = new PersistentInt("clickedSignalIdx", -1);
        this.actorOrder = new PersistentArray("actorOrderVM");

        this.diag_signals = []; // helper array of signals of original diagram (without notes)
    }

    init() {
        this.model.init(this.toggles["showIds"].uiElem.checked);
        this.#addDividerEventListeners();
        this.#addScrollEventListeners();
        this.#addDiagramEventListeners();
    }

    clear() {
        this.model.clear();
        location.reload();
        this.diagramHeadContainer.style.visibility = "hidden";
    }

    update() {
        if ( ! this.model.diag) { return; }
        this.#saveScrollPosition();
        this.#updateToolbar();
        this.#updateHead();
        this.#restoreHeadScrollPosition();
        setTimeout(() => { this.#updateDiagram(); }, 0); // let head render
    }

    // ---- diagram head ----
    #updateHead() {
        this.diagramHeadContainer.style.visibility = "visible";
        this.diagramHeadDiv.innerHTML = "";
        this.model.diag.drawHeader(this.diagramHeadDiv);
        this.#updateHeadSvgElemLists();
        this.#markHeadActors();
    }

    #updateHeadSvgElemLists() {
        this.head_actor_boxes = document.querySelectorAll('rect.head-actor-box');
        this.head_actor_texts = document.querySelectorAll('text.head-actor-text');
    }

    // ---- diagram ----
    #updateDiagram() {
        this.diagramDiv.innerHTML = "";
        this.model.diag.drawSVG(this.diagramDiv, { theme: 'simple' });
        // draws in chunks to make the UI more responsive,
        // emits 'drawComplete' event to diagramContainer if ready
    }

    #addDiagramEventListeners() {
        this.diagramDiv.addEventListener("drawComplete", (event) => this.#diagramOnDrawComplete(event));
    }

    #diagramOnDrawComplete(event) {
        this.#restoreDiagramScrollPosition();
        this.#updateDiagramSvgElemLists();
        this.#drawSignalSeqNumCircles();
        this.#applySignalClick(this.clickedSignalSeqNum.get());
        this.#markActors();
        this.#addActorMoveBtns();
        this.#addSignalEventListeners();
        this.#addActorEventListeners();
    }

    #updateDiagramSvgElemLists() {
        this.head_actor_boxes = document.querySelectorAll('rect.head-actor-box');
        this.head_actor_texts = document.querySelectorAll('text.head-actor-text');
        this.signal_paths = document.querySelectorAll('path.signal-arrow');
        this.signal_texts = document.querySelectorAll('text.signal');
        this.actor_paths = document.querySelectorAll('path.actor-line');
        this.actor_boxes = document.querySelectorAll('rect.actor-box');
        this.actor_texts = document.querySelectorAll('text.actor-text');
        this.seqNum_circles = document.querySelectorAll('circle.seq-num');
        this.seqNum_texts = document.querySelectorAll('text.seq-num');

        if (this.model.diag) {
            this.diag_signals = this.model.diag.signals.filter(item => item.type === 'Signal');
        }
    }

    // ---- scroll ----
    #addScrollEventListeners() {
        this.diagramContainer.onscroll = () => this.#syncScroll();
    }

    #syncScroll() {
        this.diagramHeadContainer.scrollLeft = diagramContainer.scrollLeft;
    }

    #resetScrollPosition() {
        const c = this.diagramContainer;
        c.scrollLeft = 0;
        c.scrollTop = 0;
    }

    #saveScrollPosition() {
        const c = this.diagramContainer;
        this.scrollLeft = c.scrollLeft;
        this.scrollTop = c.scrollTop;
        this.scrollWidth = c.scrollWidth;
        this.scrollHeight = c.scrollHeight;
        this.clientWidth = c.clientWidth;
        this.clientHeight = c.clientHeight;
    }

    #restoreHeadScrollPosition() {
        this.diagramHeadContainer.scrollLeft = this.scrollLeft;
    }

    #restoreDiagramScrollPosition() {
        const c = this.diagramContainer;
        c.scrollLeft = this.scrollLeft;
        c.scrollTop  = this.scrollTop == 0 ? 0 : (this.scrollTop + this.clientHeight / 2) * 
                                                 (c.scrollHeight / this.scrollHeight) - c.clientHeight / 2;
    }

    // ---- toolbar ----
    #updateToolbar() {
        this.#updateFileInputLabel();
    }

    navbarBrandOnClick() {
        this.clear();
    }

    fileInputOnClick() {
        fileInput.value = "";  // so same file can be selected again
    }

    fileInputOnChange(event) {
        this.model.loadDiagramFromFile(event.target.files[0]);
    }

    #updateFileInputLabel() {
        this.fileInputLabel.textContent = this.model.fileName.get() + ' | ' +
                                          this.model.fileLastMod.get() + ' | ' +
                                          this.model.fileSize.get() + ' bytes';
    }

    #showIdsOnChange(vm, isOn) {
        vm.model.includeIdsInSignalMsgs(isOn);
    }

    #markSignalsHandler(vm) {
        vm.#markSignals(vm.#indexOfSignal(vm.clickedSignalSeqNum.get()));
    }

    resetToolbarOnClick() {
        Object.entries(this.toggles).forEach(([key, value]) => { value.reset(); });
        this.clickedSignalSeqNum.set(1);
        this.#resetScrollPosition();
        this.model.reset();
    }

    // ---- signal ----
    #drawSignalSeqNumCircles() {
        this.signal_paths.forEach((path, index) => {
            // Get the starting point of the path
            const start = path.getPointAtLength(0);

            // Create a circle element
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", start.x);
            circle.setAttribute("cy", start.y);
            circle.setAttribute("r", 13); // Radius of the circle
            circle.setAttribute("fill", "white"); // Color of the circle
            circle.setAttribute("stroke", "black"); // Border color
            circle.setAttribute("stroke-width", 1); // Border width
            circle.setAttribute("class", "seq-num"); // Border width

            // Create a text element
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", start.x);
            text.setAttribute("y", start.y);
            text.setAttribute("text-anchor", "middle"); // Center text horizontally
            text.setAttribute("dy", "0.35em"); // Center text vertically
            text.setAttribute("fill", "black"); // Color of the text inside the circle
            text.setAttribute("font-size", "13px"); // Border width
            text.setAttribute("class", "seq-num"); // Border width
            text.textContent = this.diag_signals[index].seqNum;

            // Append them to the SVG element
            path.parentNode.appendChild(circle);
            path.parentNode.appendChild(text);
        });

        this.seqNum_circles = document.querySelectorAll('circle.seq-num');
        this.seqNum_texts = document.querySelectorAll('text.seq-num');
    }

    #addSignalEventListeners() {
        this.signal_texts.forEach((txt, index) => {
            txt.onclick = () => this.#signalTextOnClick(index);
            txt.onmouseenter = () => this.#showAddinfoContent(index);
            txt.onmouseleave = () => this.#showAddinfoContent(this.#indexOfSignal(this.clickedSignalSeqNum.get()));
        });
    }

    #signalTextOnClick(index) {
        let seqNum = this.diag_signals[index].seqNum;
        if(this.clickedSignalSeqNum.get() == seqNum) {
           seqNum = -1;
        }
        this.#applySignalClick(seqNum);
    }

    #applySignalClick(seqNum) {
        let i = this.#indexOfSignal(seqNum);
        this.clickedSignalSeqNum.set(seqNum);
        this.#showAddinfoContent(i);
        this.#markSignals(i);
    }

    #indexOfSignal(seqNum) {
        let i = this.diag_signals.length;
        while ( i --> 0 ) {
            if (seqNum == this.diag_signals[i].seqNum) {
                break;
            }
        }
        return i;
    }

    #showAddinfoContent(index) {
        const notation = document.getElementById("notation");
        const meta = document.getElementById("meta");
        const addinfo = document.getElementById("addinfo");
        notation.textContent = "";
        meta.textContent = "";
        addinfo.textContent = "";
        if (index < 0)
            return;
        if (index < this.diag_signals.length) {
            const s = this.diag_signals[index];
            notation.textContent = `${s.seqNum}. ${s.actorA.alias} -> ${s.actorB.alias}: ${s.message}`;
            meta.textContent = s.meta;
            addinfo.textContent = s.addinfo;
        }
    }

    #markSignals(refIndex) {
        let refSig = 0 <= refIndex && refIndex < this.diag_signals.length
                     ? this.diag_signals[refIndex] : { "addinfoHead": { "srcInstanceId": null,
                                                                        "dstInstanceId": null } };
        this.diag_signals.forEach((s, i) => {

            let text = this.signal_texts[i];
            let circle = this.seqNum_circles[i];
            let seqNum = this.seqNum_texts[i];

            let isOfSameInstance = false;
            let isRelated = false;
            let cl = '';

            if(s.addinfoHead.srcInstanceId) {

                isOfSameInstance = refSig.addinfoHead.srcInstanceId &&
                                      s.addinfoHead.srcInstanceId === refSig.addinfoHead.srcInstanceId;
                cl = 'same-id-signal';
                if(isOfSameInstance && this.toggles["showInstance"].uiElem.checked) {
                    text.classList.add(cl);
                    circle.classList.add(cl);
                    seqNum.classList.add(cl);
                } else {
                    text.classList.remove(cl);
                    circle.classList.remove(cl);
                    seqNum.classList.remove(cl);
                }

                isRelated = refSig.addinfoHead.srcInstanceId &&
                              (s.addinfoHead.dstInstanceId === refSig.addinfoHead.srcInstanceId ||
                               s.addinfoHead.srcInstanceId === refSig.addinfoHead.dstInstanceId);
                cl = 'related-signal';
                if(isRelated && this.toggles["showRelated"].uiElem.checked) {
                    text.classList.add(cl);
                    circle.classList.add(cl);
                    seqNum.classList.add(cl);
                } else {
                    text.classList.remove(cl);
                    circle.classList.remove(cl);
                    seqNum.classList.remove(cl);
                }
            }

            if (s.addinfoHead) {
                if (s.addinfoHead.isSpecial || s.addinfoHead.size <= 0) {
                    text.classList.add("special-signal");
                }
            }

            if (i === refIndex) {
                text.classList.add('clicked-signal');
                circle.classList.add('clicked-signal-circle');
                seqNum.classList.add('clicked-signal-seq-num');
            } else {
                text.classList.remove('clicked-signal');
                circle.classList.remove('clicked-signal-circle');
                seqNum.classList.remove('clicked-signal-seq-num');
            }
        });
    }

    // ---- actor ----
    #addActorEventListeners() {
        this.actorOrder.clear();
        this.model.diag.actors.forEach((a, i) => {
            this.actorOrder.add(a.name);
            if (a.signalCount > 0 || this.model.filteredActors.has(a.name)) {
                this.head_actor_texts[i].onclick = () => this.#actorTextOnClick(i);
                this.actor_texts[2*i].onclick = () => this.#actorTextOnClick(i);
                this.actor_texts[2*i+1].onclick = () => this.#actorTextOnClick(i);
            }
        });
    }

    #actorTextOnClick(index) {
        this.model.toggleActor(index);
    }

    #addActorMoveBtns() {
        this.#addMoveBtnsToElemList('.head-actor-box');
        this.#addMoveBtnsToElemList('.actor-top-box');
        this.#addMoveBtnsToElemList('.actor-bottom-box');
    }

    #addMoveBtnsToElemList(uiElemId) {
        const elemList = document.querySelectorAll(uiElemId)
        elemList.forEach((elem, index) => {
            const rectX = parseFloat(elem.getAttribute('x'));
            const rectY = parseFloat(elem.getAttribute('y'));
            if(index > 0) {
                elem.parentNode.appendChild( this.#createMoveBtn(index, rectX-8, rectY+11, 'left') );
            }
            if(index < this.model.diag.actors.length - 1) {
                const rectWidth = parseFloat(elem.getAttribute('width'));
                elem.parentNode.appendChild( this.#createMoveBtn(index, rectX+rectWidth-8, rectY+11, 'right') );
            }
        });
    }

    #createMoveBtn(idx, x, y, dir) {
        const moveBtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        moveBtn.setAttribute("width", "16");
        moveBtn.setAttribute("height", "16");
        moveBtn.setAttribute("fill", "currentColor");
        moveBtn.setAttribute("class", "move move-" + dir);
        moveBtn.innerHTML = dir == 'left' ? `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>`
                              /* right */ : `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>`;
        moveBtn.setAttribute("x", x);
        moveBtn.setAttribute("y", y);
        moveBtn.onclick = () => this.#actorMoveBtnOnClick(idx, dir);
        return moveBtn;
    }

    #actorMoveBtnOnClick(index, dir) {
        if(dir == 'left') {
            this.actorOrder.move(index, index - 1);
        } else if (dir == 'right') {
            this.actorOrder.move(index, index + 1);
        }
        this.model.setActorOrder(this.actorOrder.getArray());
    }

    #markHeadActors() {
        this.model.diag.actors.forEach((a, i) => {
            let cl = 'filtered-actor';
            if (this.model.filteredActors.has(this.model.diag.actors[i].name)) {
                this.head_actor_boxes[i].classList.add(cl);
                this.head_actor_texts[i].classList.add(cl);
            }
            cl = 'orphan-actor';
            if (a.signalCount == 0) {
                this.head_actor_boxes[i].classList.add(cl);
                this.head_actor_texts[i].classList.add(cl);
            }
        });
    }

    #markActors() {
        this.model.diag.actors.forEach((a, i) => {
            let cl = 'filtered-actor';
            if (this.model.filteredActors.has(this.model.diag.actors[i].name)) {
                this.actor_boxes[2*i].classList.add(cl);
                this.actor_boxes[2*i+1].classList.add(cl);
                this.actor_texts[2*i].classList.add(cl);
                this.actor_texts[2*i+1].classList.add(cl);
                this.actor_paths[i].classList.add(cl);
            }
            cl = 'orphan-actor';
            if (a.signalCount == 0) {
                this.actor_boxes[2*i].classList.add(cl);
                this.actor_boxes[2*i+1].classList.add(cl);
                this.actor_texts[2*i].classList.add(cl);
                this.actor_texts[2*i+1].classList.add(cl);
                this.actor_paths[i].classList.add(cl);
            }
        });
    }

    // ---- divider -----
    #addDividerEventListeners() {
        document.onmousemove = (e) => this.#documentOnMouseMove(e);
        document.onmouseup = () => this.#documentOnMouseUp();
        document.getElementById("divider").onmousedown = (e) => this.dividerOnMouseDown(e);
    }

    dividerOnMouseDown(e) {
        this.isResizing = true;
        this.startY = e.clientY; 
        this.startDiagramHeight = document.getElementById("diagramArea").offsetHeight;
        document.body.style.userSelect = "none";
        document.body.style.cursor = 'row-resize';
    }

    #documentOnMouseMove(e) {
        if (this.isResizing) {
            const deltaY = e.clientY - this.startY;
            const totalHeight = document.body.offsetHeight;
            const diagramHeight = (this.startDiagramHeight + deltaY) / totalHeight * 100;
            const infoHeight = 100 - diagramHeight;

            if (diagramHeight > 5 && infoHeight > 5) {
                document.getElementById("diagramArea").style.height = `${diagramHeight}%`;
                document.getElementById("addinfoDisplay").style.height = `${infoHeight}%`;
            }
        }
    }

    #documentOnMouseUp() {
        this.isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = "";
    }
}


/* ============================
 * Application Initialization
 * ============================ */
const asdfM = new AsdfModel();
const asdfVM = new AsdfViewModel(asdfM);
window.onload = () => asdfVM.init();
window.asdfVM = asdfVM;
}());
