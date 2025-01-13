/*
Copyright (c) 2024-2025 Tamás Dezső (asdf.hu)
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

    size() {
        return this.set.size;
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
    #defaultValue;
    constructor(key, defaultValue = false) {
        this.key = key;
        this.#defaultValue = defaultValue;
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

    reset() {
        this.set(this.#defaultValue);
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
        try {
            localStorage.setItem(this.key, this.value);
        } catch (e) {
            // clear localStorage, so in-memory value can be used instead
            try { localStorage.setItem(this.key, ""); } catch(e) {};
        }
    }

    get() {
        try {
            return localStorage.getItem(this.key) || this.value;
        } catch {
            return this.value;
        }
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

    set(newValue = 0) {
        if ( ! Number.isInteger(newValue)) {
            throw new Error("PersistentInt can only store integer values.");
        }
        this.value = newValue;
        this.#save();
    }

    increment(amount = 1) {
        if ( ! Number.isInteger(amount)) {
            throw new Error("Can only increment with integer values.");
        }
        this.set(this.value + amount);
    }

    decrement(amount = 1) {
        if ( ! Number.isInteger(amount)) {
            throw new Error("Can only decrement with integer values.");
        }
        this.set(this.value - amount);
    }

    clear() {
        this.set();
    }

    add(value) {
        this.increment(value);
    }

    subtract(value) {
        this.decrement(value);
    }
}


class PersistentToggle {
    #uiElem;
    #value;
    #onChangeHandler;
    #onChangeArg;

    constructor(uiElemId, defaultValue, onChangeHandler, onChangeArg) {
        this.#value = new PersistentBool(uiElemId, defaultValue);
        this.#onChangeHandler = onChangeHandler;
        this.#onChangeArg = onChangeArg;

        this.#uiElem = document.getElementById(uiElemId) || {};
        this.#uiElem.checked = this.#value.get();
        this.#uiElem.onchange = () => this.set(this.#uiElem.checked);
    }

    toggle() {
        this.set( ! this.isOn())
    }

    isOn() {
        return this.#value.get();
    }

    set(isOn) {
        this.#value.set(isOn);
        this.#uiElem.checked = isOn;
        this.#onChangeHandler(this.#onChangeArg, isOn);
    }

    reset() {
        this.#value.reset();
        this.set(this.#value.get());
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
        this.relevantSignalStart = new PersistentInt("signalStart", 0);
        this.relevantSignalCount = new PersistentInt("signalCount", 1000);
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
    }

    reset() {
        this.diagSrcPreamble.set("");
        this.filteredActors.clear();
        this.setRelevantSignals(0, this.relevantSignalCount.get());
        this.isShowIds = false;
        this.loadDiagramFromSrc();
    }

    loadDiagramFromFile(file) {
        let model = this;

        model.fileName.set(file.name);
        model.fileSize.set(file.size);
        const lastMod = new Date(file.lastModified);
        const shortTime = lastMod.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        model.fileLastMod.set(lastMod.getFullYear() +
                              '-' +
                              String(lastMod.getMonth()+1).padStart(2, '0') +
                              '-' +
                              String(lastMod.getDate()).padStart(2, '0') +
                              ' ' +
                              shortTime);

        const reader = new FileReader();
        reader.onload = function(e) {
            model.diagSrc.set(e.target.result);
            model.loadDiagramFromSrc();
        };
        reader.readAsText(file);
    }

    sideLoadDiagram() {
        let diag = Diagram.parse(this.diagSrc.get());
        this.#removeSignalsOfFilteredActors(diag);
        return diag;
    }

    loadDiagramFromSrc() {
        if (this.diagSrc.length() > 0) {
            this.diag = Diagram.parse(this.diagSrc.get());
            this.diag.netSignalCount = this.diag.signals.length;
            if (this.#arraysHaveSameElements(this.actorOrder.getArray(), this.diag.actors.map(element => element.name))) {
                let src = [this.diagSrcPreamble.get(), this.diagSrc.get()].join('\n\n');
                this.diag = Diagram.parse(src);
            }
            this.#removeSignalsOfFilteredActors(this.diag);
            this.#removeIrrelevantSignals();
            this.#countActorSignals();
            if (this.isShowIds) {
                this.includeIdsInSignalMsgs(this.isShowIds, false);
            }
            delete this.diag.title; // throw title, otherwise the diagram would be misaligned with the floating header
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
        } else {
            this.filteredActors.add(a.name);
        }
        this.loadDiagramFromSrc();
    }

    setActorOrder(actorOrder) {
        this.actorOrder.setArray(actorOrder);
        this.#setPreamble( this.#printArrayElementsAsParticipants(this.actorOrder.getArray()) );
    }

    #countActorSignals() {
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

    #removeSignalsOfFilteredActors(diag) {
        if ( ! diag || ! diag.signals || ! diag.signals.length) {
            return;
        }
        let s;
        for (let i = diag.signals.length - 1; i >= 0; i--) {
            s = diag.signals[i];
            if ((s.type === 'Signal' && (this.filteredActors.has(s.actorA.name) ||
                                         this.filteredActors.has(s.actorB.name))) ||
                (s.type === 'Note' && this.filteredActors.has(s.actor.name))) {
                 diag.signals.splice(i, 1);
            }
        }
        diag.netSignalCount = this.diag.signals.filter(signal => signal.type === 'Signal').length;
    }

    initRelevantSignals(start, count) {
        this.relevantSignalStart.set(start);
        this.relevantSignalCount.set(count);
    }

    setRelevantSignals(start, count) {
        this.initRelevantSignals(start, count);
        this.loadDiagramFromSrc();
    }

    #removeIrrelevantSignals() {
        this.diag.signals.splice(0, this.relevantSignalStart.get());
        this.diag.signals.splice(this.relevantSignalCount.get());
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


/* ====================================================================
 * Auxiliary classes to support the View Model
 * ==================================================================== */
class ActiveSignal {
    #seqNum;

    constructor(name, signals) {
        this.signals = signals;
        this.#seqNum = new PersistentInt(name, -1);
    }

    setBySeqNum(seqNum) {
        this.#seqNum.set(seqNum);
    }

    reset() {
        this.setBySeqNum(-1);
    }

    setByIdx(idx) {
        if (idx < 0 || idx > this.signals.length - 1) {
            console.warn("Attempt to set Active Signal to invalid index");
            return;
        }
        this.setBySeqNum(this.signals[idx].seqNum);
    }

    getIdx() {
        return this.#indexOf(this.#seqNum.get());
    }

    getSeqNum() {
        return this.#seqNum.get();
    }

    #indexOf(seqNum) {
        let idx = this.signals.length;
        while ( idx --> 0 ) {
            if (seqNum == this.signals[idx].seqNum) {
                break;
            }
        }
        return idx;
    }

    setNext() {
        this.setByIdx(this.getIdx() + 1);
    }

    setPrev() {
        this.setByIdx(this.getIdx() - 1);
    }

    setFirst() {
        this.setByIdx(0);
    }

    setLast() {
        this.setByIdx(this.signals.length - 1);
    }

    isFirst() {
        return this.getIdx() == 0;
    }

    isLast() {
        return this.getIdx() == this.signals.length - 1;
    }

    #isValidIdx(idx) {
        return 0 <= idx && idx < this.signals.length;
    }

    isValid() {
        return this.#isValidIdx(this.getIdx());
    }
}


class HoverGate {
    #isOpen;
    #callbacks;

    constructor() {
        this.#isOpen = true;
        this.#callbacks = [];
    }

    subscribe(observer) {
        this.#callbacks.push(observer);
    }

    #notify() {
        this.#callbacks.forEach(callback => callback());
    }

    open() {
        this.#isOpen = true;
        document.body.classList.remove('no-hover');
        this.#notify();
    }

    close() {
        this.#isOpen = false;
        document.body.classList.add('no-hover');
        this.#addRestorer();
        this.#notify();
    }

    isOpen() {
        return this.#isOpen;
    }

    #addRestorer() {
        ['mousemove', 'click', 'wheel'].forEach(event => {
            window.addEventListener(event, () => this.open(), { once: true });
        });
    }
}


class offCanvasWrapper {
    constructor(docElementId) {
        this.docElem = document.getElementById(docElementId);
        this.offCanvas = new bootstrap.Offcanvas(this.docElem);
    }

    toggle() {
        this.docElem.classList.contains('show') ? this.offCanvas.hide() : this.offCanvas.show();
    }
}


/* ==============================
 * View Model: UI and Rendering
 * ============================== */
class AsdfViewModel  {
    #isFileInputChange;
    #signal_hits;
    #isLastSearchValid;
    #hoverGate;
    #help;

    constructor(model) {
        this.model = model;
        this.model.subscribe(this);
        this.isResizing = false;
        this.pageSize = 200;
        this.timeOffsetX = 45;
        this.#signal_hits = [];
        this.#isLastSearchValid = false;
        this.#hoverGate = new HoverGate();
        this.#hoverGate.subscribe(() => this.#showActiveSignalAddinfo());
        this.#help = new offCanvasWrapper("helpOffcanvas");

        // toolbar
        this.fileInput = document.getElementById("fileInput");
        this.fileInputLabel = document.getElementById("fileInputLabel");
        this.toggles = {
            "showTime": new PersistentToggle("showTimeToggle", true, this.#showTimeOnChange, this),
            "showIds": new PersistentToggle("showIdsToggle", false, this.#showIdsOnChange, this),
            "showInstance": new PersistentToggle("showInstanceToggle", false, this.#markSignalsHandler, this),
            "showRelated": new PersistentToggle("showRelatedToggle", false, this.#markSignalsHandler, this)
        }

        // placeholders
        this.diagramSearch = document.getElementById("diagramSearch");
        this.diagramSearchInput = document.getElementById("diagramSearchInput");
        this.diagramHeadContainer = document.getElementById("diagramHeadContainer");
        this.diagramHeadDiv = document.getElementById("diagramHead");
        this.diagramContainer = document.getElementById("diagramContainer");
        this.diagramDiv = document.getElementById("diagram");
        this.paginator = document.getElementById("paginator");
        this.pageFirstBtn = document.getElementById("pageFirst");
        this.pagePrevBtn = document.getElementById("pagePrev");
        this.pageNextBtn = document.getElementById("pageNext");
        this.pageLastBtn = document.getElementById("pageLast");
        this.searchStats = document.getElementById("searchStats");

        // view state
        this.diag_signals = []; // helper array of signals of original diagram (without notes)
        this.activeSignal = new ActiveSignal("selectedSignal", this.diag_signals);
        this.currHit = new ActiveSignal("activeHit", this.#signal_hits);
        this.actorOrder = new PersistentArray("actorOrderVM");
        this.currPage = new PersistentInt("currPage", 0);
    }

    init() {
        this.model.init(this.toggles["showIds"].isOn());
        this.#addDocumentEventListeners();
        this.#addDividerEventListeners();
        this.#addScrollEventListeners();
        this.#addDiagramEventListeners();
        this.#initTooltips();
    }

    #initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl, {
                delay: { show: 750, hide: 100 }
            });
        });
    }

    clear() {
        this.model.clear();
        location.reload();
    }

    update() {
        this.#initDivider();
        this.#initSearch();
        this.#invalidateLastSearch();
        if ( ! this.model.diag) { return; }
        this.#saveScrollPosition();
        this.#initPaginator();
        this.#updateToolbar();
        this.#initShowTime(this.toggles["showTime"].isOn());
        this.#updateHead();
        this.#restoreHeadScrollPosition();
        setTimeout(() => {
            this.#updateDiagram();
            this.#shiftToSelectedSignal();
        }, 0); // let head render before
    }

    #addDocumentEventListeners() {
        this.#addKeyboardShortcuts();
    }

    #addKeyboardShortcuts() {
        let vm = this;
        let keySeq = "";
        document.addEventListener("keydown", function (event) {

            vm.#hoverGate.close();

            if (event.metaKey) {
                return;
            }

            if (document.activeElement === vm.diagramSearchInput) {
                if (event.key === "Enter") { vm.#performSearchSignals(); }
                if (event.key === "Escape") { vm.diagramSearchInput.blur(); }
                return;
            }

            keySeq += event.key;

            document.activeElement.blur();

            if (keySeq.endsWith("re")) { vm.resetToolbarOnClick(); }
            // view
            else if (keySeq.endsWith("ti")) { vm.toggles['showInstance'].toggle(); }
            else if (keySeq.endsWith("tr")) { vm.toggles['showRelated'].toggle(); }
            else if (keySeq.endsWith("ts")) { vm.toggles['showIds'].toggle(); }
            else if (keySeq.endsWith("tt")) { vm.toggles['showTime'].toggle(); }
            else if (event.shiftKey && event.key === "?") { vm.#help.toggle(); }
            // movement
            else if (event.key === "j") { vm.#selectNextSignal(); }
            else if (event.key === "k") { vm.#selectPrevSignal(); }
            else if (event.shiftKey && event.key === "J") { vm.#shiftToNextSignal(); }
            else if (event.shiftKey && event.key === "K") { vm.#shiftToPrevSignal(); }
            else if (keySeq.endsWith("gg")) { vm.#selectFirstSignal(); }
            else if (event.key === "G") { vm.#selectLastSignal(); }
            else if (keySeq.endsWith("zz")) { vm.#shiftToSelectedSignal(); }
            else if (event.key === "c") { vm.#shiftToSelectedSignal(); }
            else if (event.shiftKey && event.key === "H") { vm.paginatorPageFirst(); }
            else if (event.shiftKey && event.key === "L") { vm.paginatorPageLast(); }
            else if (event.key === "<") { vm.paginatorPagePrev(); }
            else if (event.key === ">") { vm.paginatorPageNext(); }
            else if (event.key === "h") { vm.paginatorPagePrev(); }
            else if (event.key === "l") { vm.paginatorPageNext(); }
            // search
            else if (event.key === "/") { event.preventDefault(); vm.#searchSignals(); }
            else if (event.key === "n") { vm.#showSearchInput(); vm.#gotoNextHit(); }
            else if (event.shiftKey && event.key === "N") { vm.#showSearchInput(); vm.#gotoPrevHit(); }
            else if (event.shiftKey && event.key === "*") { vm.#findOccurence() }
            else if (event.shiftKey && event.key === "#") { vm.#findOccurence(-1) }
            // divider
            else if (event.shiftKey && event.key === "^") { vm.#dividerTop(); }
            else if (event.key === "=") { vm.#dividerCenter(); }
            else if (event.key === "-") { vm.#dividerDefault(); }
            else if (event.shiftKey && event.key === "_") { vm.#dividerBottom(); }
            else {
                setTimeout(() => { keySeq = ""; }, 500);
            }
        });
    }

    // ----- move around -----
    #selectFirstSignal() {
        this.activeSignal.setFirst();
        this.#shiftToSelectedSignal();
        this.#applySignalClick();
    }

    #selectLastSignal() {
        this.activeSignal.setLast();
        this.#shiftToSelectedSignal();
        this.#applySignalClick();
    }

    #selectNextSignal() {
        if ( ! this.activeSignal.isValid()) {
            this.#selectFirstSignal();
        } else {
            if (this.#isSignalOutOfSight(this.activeSignal)) {
                this.activeSignal.setNext();
                this.#shiftToSelectedSignal();
            } else {
                this.activeSignal.setNext();
                this.#rollWindow(+1);
            }
            this.#applySignalClick();
        }
    }

    #selectPrevSignal() {
        if ( ! this.activeSignal.isValid()) {
            this.#selectLastSignal();
        } else {
            if (this.#isSignalOutOfSight(this.activeSignal)) {
                this.activeSignal.setPrev();
                this.#shiftToSelectedSignal();
            } else {
                this.activeSignal.setPrev();
                this.#rollWindow(-1);
            }
            this.#applySignalClick();
        }
    }

    #isSignalOutOfSight(sig) {
        const headHeight = 59;
        const signalHeight = this.#signalDistance(sig.getIdx(), sig.getIdx()+1);
        const sigY = this.signal_paths[sig.getIdx()].getPointAtLength(0).y - this.diagramContainer.scrollTop;
        return sigY - headHeight - signalHeight < 0 ||
               sigY > this.diagramContainer.offsetHeight;
    }

    #rollWindow(offset) {
        const headHeight = 59;
        const margin = 100; // let is be one signal height
        const sigY = this.signal_paths[this.activeSignal.getIdx()].getPointAtLength(0).y - this.diagramContainer.scrollTop;
        if (offset < 0 && sigY < headHeight + margin ||
            offset > 0 && sigY > this.diagramContainer.offsetHeight - margin) {
            this.#scrollSignals(offset)
        }
    }

    #shiftToNextSignal() {
        this.#selectNextSignal();
        this.#scrollSignals(+1);
    }

    #shiftToPrevSignal() {
        this.#selectPrevSignal();
        this.#scrollSignals(-1);
    }

    #scrollSignals(offset) {
        this.diagramContainer.scrollTop += this.#signalDistance(this.activeSignal.getIdx(), this.activeSignal.getIdx()+offset);
    }

    #shiftToSelectedSignal() {
        if ( ! this.activeSignal.isValid()) {
            this.diagramContainer.scrollTop = 0;
            return;
        }
        this.diagramContainer.scrollTop = this.signal_paths[this.activeSignal.getIdx()].getPointAtLength(0).y -
                                          this.diagramContainer.offsetHeight / 2;
    }

    // ----- search -----
    #initSearch() {
        this.diagramSearch.style.visibility = this.model.diag ? "visible" : "hidden";
    }

    #searchSignals() {
        this.#showSearchInput();
        this.diagramSearchInput.focus();
    }

    #showSearchInput() {
        this.diagramSearch.style.visibility = "visible";
    }

    #hideSearchInput() {
        this.diagramSearch.style.visibility = "hidden";
    }

    #performSearchSignals(dir = 1) {
        this.diagramSearchInput.blur();
        let searchPattern = this.diagramSearchInput.value;
        if (searchPattern === "") {
            this.currHit.reset();
            this.currHit.signals = [];
            this.#showSearchStats();
            return;
        }
        this.fullDiag = this.model.sideLoadDiagram();
        this.currHit.signals = this.fullDiag.signals.filter(signal => signal.type === 'Signal' &&
                                                                      (signal.message.includes(searchPattern) ||
                                                                       signal.actorA.name.includes(searchPattern) ||
                                                                       signal.actorB.name.includes(searchPattern) ||
                                                                       (signal.meta && signal.meta.includes(searchPattern)) ||
                                                                       (signal.addinfo && signal.addinfo.includes(searchPattern))));
        this.#isLastSearchValid = true;
        this.#showSearchStats();
        if (dir < 0) { this.#gotoPrevHit(); }
        else { this.#gotoNextHit(); }
    }

    #invalidateLastSearch() {
        this.#isLastSearchValid = false;
        this.#hideSearchStats();
    }

    #showSearchStats() {
        this.searchStats.innerHTML = `${this.currHit.getIdx() + 1} /<br>${this.currHit.signals.length}`;
    }

    #hideSearchStats() {
        this.searchStats.innerHTML = "";
    }

    #gotoCurrHit(dir = 1) {
        if ( ! this.#isLastSearchValid) {
            this.#performSearchSignals(dir);
            return;
        }
        this.activeSignal.setBySeqNum(this.currHit.getSeqNum());
        let page = Math.floor(this.#globalIndexOf(this.currHit.getSeqNum()) / this.pageSize);
        if (page >= 0 && page != this.currPage.get()) {
            this.#paginatorSetCurrPage(page);
        }
        this.#showSearchStats();
        setTimeout(() => {
            this.#shiftToSelectedSignal();
            this.#applySignalClick();
        }, 0); // let paging happen before
    }

    #gotoNextHit() {
        if (this.#isLastSearchValid && this.currHit.signals.length < 1) {
            return;
        }
        this.currHit.setFirst();
        const limit = this.activeSignal.isValid() ? this.activeSignal.getSeqNum()
                                                  : this.diag_signals[0].seqNum - 1;
        while (this.currHit.getSeqNum() <= limit) {
            if (this.currHit.isLast()) {
                this.currHit.setFirst();
                break;
            }
            this.currHit.setNext();
        }
        this.#gotoCurrHit();
    }

    #gotoPrevHit() {
        if (this.#isLastSearchValid && this.currHit.signals.length < 1) {
            return;
        }
        this.currHit.setLast();
        const limit = this.activeSignal.isValid() ? this.activeSignal.getSeqNum()
                                                  : this.diag_signals[this.diag_signals.length-1].seqNum + 1;
        while (this.currHit.getSeqNum() >= limit) {
            if (this.currHit.isFirst()) {
                this.currHit.setLast();
                break;
            }
            this.currHit.setPrev();
        }
        this.#gotoCurrHit(-1);
    }

    #findOccurence(dir = 1) {
        if ( ! this.activeSignal.isValid()) {
            return;
        }
        this.#showSearchInput();
        this.diagramSearchInput.value = this.diag_signals[this.activeSignal.getIdx()].message;
        this.#performSearchSignals(dir);
    }

    #globalIndexOf(seqNum) {
        let idx = this.fullDiag.signals.length;
        while ( idx --> 0 ) {
            if (seqNum == this.fullDiag.signals[idx].seqNum) {
                break;
            }
        }
        return idx;
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
        this.#drawTimestamps();
        if (this.#isFileInputChange) { this.activeSignal.setFirst(); this.#isFileInputChange = false; }
        this.#applySignalClick();
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
        this.timestamps = document.querySelectorAll('text.ts');
        this.gridlines = document.querySelectorAll('path.gridline');

        if (this.model.diag) {
            this.diag_signals = this.model.diag.signals.filter(item => item.type === 'Signal');
            this.activeSignal.signals = this.diag_signals;
        }
    }

    #signalDistance(i, j) {
        if (i < 0 || i >= this.signal_paths.length-1 ||
            j < 0 || j >= this.signal_paths.length-1) {
            return 0;
        }
        return this.signal_paths[j].getPointAtLength(0).y -
               this.signal_paths[i].getPointAtLength(0).y;
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
        // this.#updateFileInfo();
    }

    navbarBrandOnClick() {
        this.clear();
    }

    fileInputOnClick() {
        fileInput.value = "";  // so same file can be selected again
    }

    fileInputOnChange(event) {
        this.#initPaginatorCurrPage(0);
        this.model.loadDiagramFromFile(event.target.files[0]);
        this.#isFileInputChange = true;
    }

    #updateFileInputLabel() {
        let fil = this.fileInputLabel
        const filteredActorCount = this.model.diag.actors.filter(actor => this.model.filteredActors.has(actor.name)).length;
        fil.textContent = this.model.fileName.get() + "\n";
        fil.textContent += this.model.diag.actors.length + " participants";
        if (filteredActorCount > 0) {
            fil.textContent += " (" + filteredActorCount + " filtered)";
        }
        fil.textContent += "\n" + this.model.diag.signalCount + " signals";
        if (this.model.diag.netSignalCount != this.model.diag.signalCount) {
            fil.textContent += " (" + this.model.diag.netSignalCount + " shown)";
        }
    }

    #showTimeOnChange(vm, isOn) {
        vm.#initShowTime(isOn);
        vm.update();
    }

    #initShowTime(isOn) {
        if (this.model.diag) {
            this.model.diag.setOffsetX(isOn ? this.timeOffsetX : 0);
        }
    }

    #showIdsOnChange(vm, isOn) {
        vm.model.includeIdsInSignalMsgs(isOn);
    }

    #markSignalsHandler(vm) {
        vm.#markSignals(vm.activeSignal.getIdx());
    }

    resetToolbarOnClick() {
        Object.entries(this.toggles).forEach(([key, value]) => { value.reset(); });
        this.#resetScrollPosition();
        this.#initPaginatorCurrPage(0);
        this.model.reset();
        if (this.model.diag) { this.#dividerDefault(); }
        this.activeSignal.setBySeqNum(1);
    }

    // ---- paginator ----
    #initPaginator() {
        this.paginator.style.visibility = 
            this.model.diag.signalCount > this.pageSize ? "visible" : "hidden";
        this.#paginatorAssess();
        this.#paginatorUpdateInfo();
    }

    #paginatorAssess() {
        if (this.currPage.get() >= this.#paginatorPageCount()) {
            this.#paginatorSetCurrPage(this.#paginatorPageCount() - 1);
        }
        if (this.currPage.get() == 0) {
            this.pageFirstBtn.classList.add("disabled");
            this.pagePrevBtn.classList.add("disabled");
        } else {
            this.pageFirstBtn.classList.remove("disabled");
            this.pagePrevBtn.classList.remove("disabled");
        }
        if (this.currPage.get() == this.#paginatorPageCount() - 1) {
            this.pageLastBtn.classList.add("disabled");
            this.pageNextBtn.classList.add("disabled");
        } else {
            this.pageLastBtn.classList.remove("disabled");
            this.pageNextBtn.classList.remove("disabled");
        }
    }

    #paginatorUpdateInfo() {
        const pageInfo = document.getElementById("pageInfo");
        pageInfo.innerHTML = (this.currPage.get() + 1) + "/" + this.#paginatorPageCount();
    }

    #initPaginatorCurrPage(page) {
        this.currPage.set(page);
        this.diagramContainer.scrollTop = 0;
        this.model.initRelevantSignals(0, this.pageSize);
    }

    #paginatorSetCurrPage(page) {
        this.currPage.set(page);
        this.model.setRelevantSignals(page * this.pageSize - (page > 0), this.pageSize + (page > 0));
    }

    paginatorPageFirst() {
        this.#paginatorSetCurrPage(0);
    }

    paginatorPagePrev() {
        this.#paginatorSetCurrPage(this.currPage.get() - (this.currPage.get() > 0));
    }

    paginatorPageNext() {
        this.#paginatorSetCurrPage(this.currPage.get() + (this.currPage.get() < this.#paginatorPageCount() - 1));
    }

    paginatorPageLast() {
        this.#paginatorSetCurrPage(this.#paginatorPageCount() - 1);
    }

    #paginatorPageCount() {
        return Math.max(1, Math.ceil(this.model.diag.netSignalCount / this.pageSize));
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
            circle.setAttribute("r", 13);
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", 1);
            circle.setAttribute("class", "seq-num");

            // Create a text element
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", start.x);
            text.setAttribute("y", start.y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dy", "0.35em");
            text.setAttribute("fill", "black");
            text.setAttribute("font-size", "11px");
            text.setAttribute("class", "seq-num");
            text.textContent = this.diag_signals[index].seqNum;

            // Append them to the SVG element
            path.parentNode.appendChild(circle);
            path.parentNode.appendChild(text);
        });

        this.seqNum_circles = document.querySelectorAll('circle.seq-num');
        this.seqNum_texts = document.querySelectorAll('text.seq-num');
    }

    #drawTimestamps() {
        if ( ! this.toggles["showTime"].isOn() ||
             ! this.signal_paths[0]) {
            return;
        }

        let svg = this.signal_paths[0].parentNode;
        // add a background layer to append gridlines to
        const bkgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        bkgGroup.setAttribute("id", "background-layer");
        svg.insertBefore(bkgGroup, svg.firstChild);

        let prevTS = ""; 
        const gridlineWidth = this.actor_paths[this.actor_paths.length-1].getPointAtLength(0).x;
        this.signal_paths.forEach((path, index) => {
            const start = path.getPointAtLength(0);

            let currTS = ""
            if (this.diag_signals[index].addinfoHead.timestamp) {
                currTS = this.diag_signals[index].addinfoHead.timestamp.split('T')[1];
            }

            // Create an SVG text element
            const ts = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ts.setAttribute("x", 0);
            ts.setAttribute("y", start.y-6);
            ts.setAttribute("class", "ts");
            ts.textContent = currTS;
            svg.appendChild(ts);
            prevTS = currTS;

            const gridline = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gridline.setAttribute("d", `M${0},${start.y} h${gridlineWidth}`);
            gridline.setAttribute("class", "gridline");
            bkgGroup.appendChild(gridline);
        });

        this.timestamps = document.querySelectorAll('text.ts');
        this.gridlines = document.querySelectorAll('path.gridline');
    }

    #addSignalEventListeners() {
        this.signal_texts.forEach((txt, index) => {
            txt.onclick = () => this.#signalTextOnClick(index);
            txt.onmouseenter = () => { if (this.#hoverGate.isOpen()) { this.#showAddinfoContent(index); } };
            txt.onmouseleave = () => { if (this.#hoverGate.isOpen()) { this.#showActiveSignalAddinfo(); } };
        });
    }

    #signalTextOnClick(index) {
        if(this.activeSignal.getIdx() == index) {
            this.activeSignal.reset();
        } else {
            this.activeSignal.setByIdx(index);
        }
        this.#applySignalClick();
    }

    #applySignalClick() {
        this.#showActiveSignalAddinfo();
        this.#markSignals(this.activeSignal.getIdx());
        this.#markTimestamps(this.activeSignal.getIdx());
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

    #showActiveSignalAddinfo() {
        this.#showAddinfoContent(this.activeSignal.getIdx());
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
                if(isOfSameInstance && this.toggles["showInstance"].isOn()) {
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
                if(isRelated && this.toggles["showRelated"].isOn()) {
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
                text.classList.add('active-signal');
                circle.classList.add('active-signal-circle');
                seqNum.classList.add('active-signal-seq-num');
            } else {
                text.classList.remove('active-signal');
                circle.classList.remove('active-signal-circle');
                seqNum.classList.remove('active-signal-seq-num');
            }
        });
    }

    #markTimestamps(refIndex) {
        this.timestamps.forEach(g => { g.classList.remove('active-ts'); });
        if (refIndex < 0 || refIndex > this.timestamps.length - 1) {
            return;
        }
        this.timestamps[refIndex].classList.add('active-ts');
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
    #initDivider() {
        if ( ! this.model.diag) { this.#dividerBottom(); }
        else if ( ! this.wasDiag) { this.#dividerDefault(); }
        this.wasDiag = !! this.model.diag;
    }

    #addDividerEventListeners() {
        document.onmousemove = (e) => this.#documentOnMouseMove(e);
        document.onmouseup = () => this.#documentOnMouseUp();
        document.getElementById("divider").onmousedown = (e) => this.#dividerOnMouseDown(e);
    }

    #dividerOnMouseDown(e) {
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

    #setDividerPos(infoHeight) {
        const diagramHeight = 100 - infoHeight;
        document.getElementById("diagramArea").style.height = `${diagramHeight}%`;
        document.getElementById("addinfoDisplay").style.height = `${infoHeight}%`;
    }

    #dividerDefault() {
        this.#setDividerPos(15);
    }

    #dividerTop() {
        this.#setDividerPos(75);
    }

    #dividerCenter() {
        this.#setDividerPos(50);
    }

    #dividerBottom() {
        this.#setDividerPos(0);
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
