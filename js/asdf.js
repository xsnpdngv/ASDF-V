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
    #observers;

    constructor(key) {
        this.key = key;
        this.set = this.#loadSetFromLocalStorage(key);
        this.#observers = [];
    }

    subscribe() {
        this.#observers.push(observer);
    }

    #notify() {
        this.#observers.forEach(observer => observer.update());
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
        this.#notify();
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


/* ==============================
 * View Model: UI and Rendering
 * ============================== */
class AsdfViewModel  {
    #isFileInputChange;
    #signal_hits;
    #hoverGate;
    #help;
    #signalNavigator;
    #divider;
    #search;
    #searchDiag;
    #paginator;

    constructor(model) {
        this.model = model;
        this.model.subscribe(this);
        this.pageSize = 200;
        this.timeOffsetX = 45;
        this.#signal_hits = [];
        this.#hoverGate = new AsdfViewModel.HoverGate();
        this.#hoverGate.subscribe(() => this.#showActiveSignalAddinfo());
        this.#help = new AsdfViewModel.OffCanvasWrapper("helpOffcanvas");
        this.#searchDiag = null;

        // toolbar
        this.fileInput = document.getElementById("fileInput");
        this.fileInputLabel = document.getElementById("fileInputLabel");
        this.toggles = {
            "showTime": new AsdfViewModel.PersistentToggle("showTimeToggle", true, this.#showTimeOnChange, this),
            "showIds": new AsdfViewModel.PersistentToggle("showIdsToggle", false, this.#showIdsOnChange, this),
            "showInstance": new AsdfViewModel.PersistentToggle("showInstanceToggle", false, this.#markSignalsHandler, this),
            "showRelated": new AsdfViewModel.PersistentToggle("showRelatedToggle", false, this.#markSignalsHandler, this)
        }

        this.diagramHeadContainer = document.getElementById("diagramHeadContainer");
        this.diagramHeadDiv = document.getElementById("diagramHead");
        this.diagramContainer = document.getElementById("diagramContainer");
        this.diagramDiv = document.getElementById("diagram");
        this.#divider = new AsdfViewModel.Divider("diagramArea", "addinfoDisplay", "divider");
        this.#search = new AsdfViewModel.Search("diagramSearch", "diagramSearchInput");
        this.#paginator = new AsdfViewModel.Paginator( model, { containerId: "paginator",
                                                                pageFirstBtnId: "pageFirst",
                                                                pagePrevBtnId: "pagePrev",
                                                                pageNextBtnId: "pageNext",
                                                                pageLastBtnId: "pageLast",
                                                                pageInfoId: "pageInfo" });
        this.diag_signals = []; // helper array of signals of original diagram (without notes)
        this.signalCursor = new AsdfViewModel.SignalCursor("signals", this.diag_signals);
        this.hitCursor = new AsdfViewModel.SignalCursor("hits", this.#signal_hits);
        this.hitCursorDisplay = new AsdfViewModel.CursorDisplay(this.hitCursor, "searchStats");
        this.actorOrder = new PersistentArray("actorOrderVM");
        this.#signalNavigator = new AsdfViewModel.SignalNavigator('path.signal-arrow', this.signalCursor,
                                                                  { diagramContainerId: "diagramContainer" },
                                                                  () => this.#applySignalClick());
    }

    init() {
        this.model.init(this.toggles["showIds"].isOn());
        this.#addDocumentEventListeners();
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
        this.#positionDivider();
        this.#invalidateLastSearch();
        this.model.diag ? this.#search.show() : this.#search.hide();
        if ( ! this.model.diag) { return; }
        this.#saveScrollPosition();
        this.#paginator.assess();
        this.#updateToolbar();
        this.#initShowTime(this.toggles["showTime"].isOn());
        this.#updateHead();
        this.#restoreHeadScrollPosition();
        setTimeout(() => {
            this.#updateDiagram();
            this.#signalNavigator.toCursor();
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

            if (vm.#search.isActive()) {
                if (event.key === "Enter") { vm.#performSearchSignals(); }
                if (event.key === "Escape") { vm.#search.blur(); }
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
            else if (event.key === "j") { vm.#signalNavigator.toNext(); }
            else if (event.key === "k") { vm.#signalNavigator.toPrev(); }
            else if (event.shiftKey && event.key === "J") { vm.#signalNavigator.shiftToNext(); }
            else if (event.shiftKey && event.key === "K") { vm.#signalNavigator.shiftToPrev(); }
            else if (keySeq.endsWith("gg")) { vm.#signalNavigator.toFirst(); }
            else if (event.key === "G") { vm.#signalNavigator.toLast(); }
            else if (keySeq.endsWith("zz")) { vm.#signalNavigator.toCursor(); }
            else if (event.key === "c") { vm.#signalNavigator.toCursor(); }
            else if (event.shiftKey && event.key === "H") { vm.#paginator.firstPage(); }
            else if (event.shiftKey && event.key === "L") { vm.#paginator.lastPage(); }
            else if (event.key === "<") { vm.#paginator.prevPage(); }
            else if (event.key === ">") { vm.#paginator.nextPage(); }
            else if (event.key === "h") { vm.#paginator.prevPage(); }
            else if (event.key === "l") { vm.#paginator.nextPage(); }
            // search
            else if (event.key === "/") { event.preventDefault(); vm.#search.trigger(); }
            else if (event.key === "n") { vm.#search.show(); vm.#gotoNextHit(); }
            else if (event.shiftKey && event.key === "N") { vm.#search.show(); vm.#gotoPrevHit(); }
            else if (event.shiftKey && event.key === "*") { vm.#findOccurrence() }
            else if (event.shiftKey && event.key === "#") { vm.#findOccurrence(-1) }
            // divider
            else if (event.shiftKey && event.key === "^") { vm.#divider.toTop(); }
            else if (event.key === "=") { vm.#divider.toCenter(); }
            else if (event.key === "-") { vm.#divider.toDefaultPos(); }
            else if (event.shiftKey && event.key === "_") { vm.#divider.toBottom(); }
            else {
                setTimeout(() => { keySeq = ""; }, 500);
            }
        });
    }

    #performSearchSignals(dir = 1) {
        this.hitCursor.reset();
        this.#searchDiag = this.model.sideLoadDiagram();
        this.hitCursor.setCollection(this.#search.getResults(this.#searchDiag?.signals));
        this.hitCursorDisplay.show();
        dir < 0 ? this.#gotoPrevHit() : this.#gotoNextHit();
    }

    #invalidateLastSearch() {
        this.#searchDiag = null;
        this.hitCursorDisplay.hide();
    }

    #gotoCurrHit(dir = 1) {
        if ( ! this.#searchDiag) {
            this.#performSearchSignals(dir);
            return;
        }
        this.signalCursor.set(this.hitCursor.get());
        this.#paginator.goToPageOfSignal(this.#globalIndexOf(this.hitCursor.seqNum, this.#searchDiag?.signals));
        this.hitCursorDisplay.show();
        setTimeout(() => {
            this.#signalNavigator.toCursor();
            this.#applySignalClick();
        }, 0); // let paging happen before
    }

    #gotoNextHit() {
        if (this.#searchDiag && this.hitCursor.collectionLength() < 1) {
            return;
        }
        this.hitCursor.home();
        const limit = this.signalCursor.isValid() ? this.signalCursor.seqNum
                                                  : this.diag_signals[0].seqNum - 1;
        while (this.hitCursor.get() <= limit) {
            if (this.hitCursor.isAtEnd()) {
                this.hitCursor.home();
                break;
            }
            this.hitCursor.next();
        }
        this.#gotoCurrHit();
    }

    #gotoPrevHit() {
        if (this.#searchDiag && this.hitCursor.collectionLength() < 1) {
            return;
        }
        this.hitCursor.end();
        const limit = this.signalCursor.isValid() ? this.signalCursor.seqNum
                                                  : this.diag_signals[this.diag_signals.length-1].seqNum + 1;
        while (this.hitCursor.seqNum >= limit) {
            if (this.hitCursor.isAtHome()) {
                this.hitCursor.end();
                break;
            }
            this.hitCursor.prev();
        }
        this.#gotoCurrHit(-1);
    }

    #findOccurrence(dir = 1) {
        if ( ! this.signalCursor.isValid()) {
            return;
        }
        this.#search.show();
        this.#search.setPattern(this.diag_signals[this.signalCursor.getIdx()].message);
        this.#performSearchSignals(dir);
    }

    #globalIndexOf(seqNum, signals = []) {
        let idx = signals.length;
        while ( idx --> 0 ) {
            if (seqNum == signals[idx].seqNum) {
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
        if (this.#isFileInputChange) { this.signalCursor.home(); this.#isFileInputChange = false; }
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
            this.signalCursor.setCollection(this.diag_signals);
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
        this.#paginator.init();
        this.diagramContainer.scrollTop = 0;
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
        vm.#markSignals(vm.signalCursor.getIdx());
    }

    resetToolbarOnClick() {
        Object.entries(this.toggles).forEach(([key, value]) => { value.reset(); });
        this.#resetScrollPosition();
        this.#paginator.init();
        this.diagramContainer.scrollTop = 0;
        this.model.reset();
        if (this.model.diag) { this.#divider.toDefaultPos(); }
        this.signalCursor.set(1);
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
        if(this.signalCursor.getIdx() == index) {
            this.signalCursor.set(-1);
        } else {
            this.signalCursor.setByIdx(index);
        }
        this.#applySignalClick();
    }

    #applySignalClick() {
        this.#showActiveSignalAddinfo();
        this.#markSignals(this.signalCursor.getIdx());
        this.#markTimestamps(this.signalCursor.getIdx());
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
        this.#showAddinfoContent(this.signalCursor.getIdx());
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
        this.timestamps?.forEach(g => { g.classList.remove('active-ts'); });
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

    #positionDivider() {
        if ( ! this.model.diag) { this.#divider.toBottom(); }
        else if ( ! this.wasDiag) { this.#divider.toDefaultPos(); }
        this.wasDiag = !! this.model.diag;
    }


    // ====== auxiliary inner classes ======


    // ---- PersistentToggle ----
    static PersistentToggle = class {
        #guiElem;
        #value;
        #onChangeHandler;
        #onChangeArg;

        constructor(guiElemId, defaultValue, onChangeHandler, onChangeArg) {
            this.#value = new PersistentBool(guiElemId, defaultValue);
            this.#onChangeHandler = onChangeHandler;
            this.#onChangeArg = onChangeArg;

            this.#guiElem = document.getElementById(guiElemId) || {};
            this.#guiElem.checked = this.#value.get();
            this.#guiElem.onchange = () => this.set(this.#guiElem.checked);
        }

        toggle() {
            this.set( ! this.isOn())
        }

        isOn() {
            return this.#value.get();
        }

        set(isOn) {
            this.#value.set(isOn);
            this.#guiElem.checked = isOn;
            this.#onChangeHandler(this.#onChangeArg, isOn);
        }

        reset() {
            this.#value.reset();
            this.set(this.#value.get());
        }
    }; // PersistentToggle


    // ---- Divider -----
    static Divider = class {
        #upperArea;
        #lowerArea;
        #divider;
        #isResizing;
        #startY;
        #startUpperAreaHeight;

        constructor(upperAreaId, lowerAreaId, dividerId) {
            this.#upperArea = document.getElementById(upperAreaId);
            this.#lowerArea = document.getElementById(lowerAreaId);
            this.#divider = document.getElementById(dividerId);
            this.#addEventListeners();
            this.isResizing = false;
        }

        #addEventListeners() {
            document.onmousemove = (e) => this.#documentOnMouseMove(e);
            document.onmouseup = () => this.#documentOnMouseUp();
            this.#divider.onmousedown = (e) => this.#dividerOnMouseDown(e);
        }

        #dividerOnMouseDown(e) {
            this.#isResizing = true;
            this.#startY = e.clientY; 
            this.#startUpperAreaHeight = document.getElementById("diagramArea").offsetHeight;
            document.body.style.userSelect = "none";
            document.body.style.cursor = 'row-resize';
        }

        #documentOnMouseMove(e) {
            if (this.#isResizing) {
                const deltaY = e.clientY - this.#startY;
                const totalHeight = document.body.offsetHeight;
                const upperAreaHeight = (this.#startUpperAreaHeight + deltaY) / totalHeight * 100;
                const lowerAreaHeight = 100 - upperAreaHeight;

                if (upperAreaHeight > 5 && lowerAreaHeight > 5) {
                    this.#upperArea.style.height = `${upperAreaHeight}%`;
                    this.#lowerArea.style.height = `${lowerAreaHeight}%`;
                }
            }
        }

        #documentOnMouseUp() {
            this.#isResizing = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = "";
        }

        #setDividerPos(lowerAreaHeight) {
            const upperAreaHeight = 100 - lowerAreaHeight;
            this.#upperArea.style.height = `${upperAreaHeight}%`;
            this.#lowerArea.style.height = `${lowerAreaHeight}%`;
        }

        toDefaultPos() {
            this.#setDividerPos(15);
        }

        toTop() {
            this.#setDividerPos(75);
        }

        toCenter() {
            this.#setDividerPos(50);
        }

        toBottom() {
            this.#setDividerPos(0);
        }
    }; // Divider


    // ---- SignalCursor ----
    static SignalCursor = class {
        #cursorSeqNum;
        #collection;

        constructor(name, collection = []) {
            this.setCollection(collection);
            this.#cursorSeqNum = new PersistentInt(name, -1);
            this.seqNum = this.#cursorSeqNum.value;
        }

        setCollection(collection = []) {
            this.#collection = Array.isArray(collection) ? collection : [];
        }

        reset() {
            this.set(-1);
            this.setCollection();
        }

        set(seqNum) {
            this.#cursorSeqNum.set(seqNum);
            this.seqNum = seqNum;
        }

        setByIdx(idx) {
            if (idx < 0 || idx > this.#collection.length - 1) {
                return;
            }
            this.set(this.#collection[idx].seqNum);
        }

        get() {
            return this.#cursorSeqNum.value;
        }

        getIdx() {
            return this.#indexOf(this.#cursorSeqNum.value);
        }

        #indexOf(seqNum) {
            let idx = this.#collection.length;
            while ( idx --> 0 ) {
                if (seqNum == this.#collection[idx].seqNum) {
                    break;
                }
            }
            return idx;
        }

        next() {
            this.setByIdx(this.getIdx() + 1);
        }

        prev() {
            this.setByIdx(this.getIdx() - 1);
        }

        home() {
            this.setByIdx(0);
        }

        end() {
            this.setByIdx(this.#collection.length - 1);
        }

        isAtHome() {
            return this.getIdx() == 0;
        }

        isAtEnd() {
            return this.getIdx() == this.#collection.length - 1;
        }

        isValid() {
            return this.#isIndexValid(this.getIdx());
        }

        #isIndexValid(idx) {
            return 0 <= idx && idx < this.#collection.length;
        }

        collectionLength() {
            return this.#collection.length;
        }
    }; // SignalCursor


    // ---- SignalNavigator ----
    static SignalNavigator = class SignalNavigator {
        static #HEAD_HEIGHT = 59;
        static #MARGIN = 100;
        #signalPathClassName = "";
        #signalCursor;
        #signalSelectAction = () => {};
        #gui = {};

        constructor(signalPathClassName, signalCursor, guiElemIds, signalSelectAction = () => {}) {
            this.#signalPathClassName = signalPathClassName;
            this.#signalCursor = signalCursor;
            this.#gui.diagramContainer = document.getElementById(guiElemIds?.diagramContainerId);
            this.#signalSelectAction = signalSelectAction;
        }

        #signalPaths() {
            return document.querySelectorAll(this.#signalPathClassName);
        }

        toCursor() {
            if ( ! this.#signalCursor.isValid()) {
                this.#gui.diagramContainer.scrollTop = 0;
                return;
            }
            this.#gui.diagramContainer.scrollTop = this.#signalPaths()[this.#signalCursor.getIdx()].getPointAtLength(0).y -
                                                   this.#gui.diagramContainer.offsetHeight / 2;
        }

        toFirst() {
            this.#signalCursor.home();
            this.toCursor();
            this.#signalSelectAction();
        }

        toLast() {
            this.#signalCursor.end();
            this.toCursor();
            this.#signalSelectAction();
        }

        toNext(isShift = false) {
            if ( ! this.#signalCursor.isValid()) {
                this.toFirst();
                return;
            }
            if (this.#isCursorOutOfSight(this.#signalCursor)) {
                this.#signalCursor.next();
                this.toCursor();
            } else {
                isShift ? this.#scrollSignals(+1) : this.#rollWindow(+1);
                this.#signalCursor.next();
            }
            this.#signalSelectAction();
        }

        toPrev(isShift = false) {
            if ( ! this.#signalCursor.isValid()) {
                this.toLast();
                return;
            }
            if (this.#isCursorOutOfSight()) {
                this.#signalCursor.prev();
                this.toCursor();
            } else {
                isShift ? this.#scrollSignals(-1) : this.#rollWindow(-1);
                this.#signalCursor.prev();
            }
            this.#signalSelectAction();
        }

        shiftToNext() {
            this.toNext(true);
        }

        shiftToPrev() {
            this.toPrev(true);
        }

        #isCursorOutOfSight() {
            const signalHeight = this.#signalDistance(this.#signalCursor.getIdx(), this.#signalCursor.getIdx()+1);
            const sigY = this.#signalPaths()[this.#signalCursor.getIdx()].getPointAtLength(0).y - this.#gui.diagramContainer.scrollTop;
            return sigY - SignalNavigator.#HEAD_HEIGHT - signalHeight < 0 ||
                   sigY > this.#gui.diagramContainer.offsetHeight;
        }

        #rollWindow(offset) {
            const sigY = this.#signalPaths()[this.#signalCursor.getIdx()].getPointAtLength(0).y - this.#gui.diagramContainer.scrollTop;
            if (offset < 0 && sigY < SignalNavigator.#HEAD_HEIGHT + SignalNavigator.#MARGIN ||
                offset > 0 && sigY > this.#gui.diagramContainer.offsetHeight - SignalNavigator.#MARGIN) {
                this.#scrollSignals(offset)
            }
        }

        #scrollSignals(offset) {
            this.#gui.diagramContainer.scrollTop += this.#signalDistance(this.#signalCursor.getIdx(), this.#signalCursor.getIdx()+offset);
        }

        #signalDistance(i, j) {
            if (i < 0 || i >= this.#signalPaths().length-1 ||
                j < 0 || j >= this.#signalPaths().length-1) {
                return 0;
            }
            return this.#signalPaths()[j].getPointAtLength(0).y -
                   this.#signalPaths()[i].getPointAtLength(0).y;
        }
    }; // SignalNavigator


    // ---- Paginator ----
    static Paginator = class {
        #gui;
        #model;
        #pageSize;
        #currPage;

        constructor(model, guiElemIds = {}) {
            this.#model = model;
            this.#gui = {};
            this.#gui.container = document.getElementById(guiElemIds?.containerId);
            this.#gui.pageFirstBtn = document.getElementById(guiElemIds?.pageFirstBtnId);
            this.#gui.pagePrevBtn = document.getElementById(guiElemIds?.pagePrevBtnId);
            this.#gui.pageNextBtn = document.getElementById(guiElemIds?.pageNextBtnId);
            this.#gui.pageLastBtn = document.getElementById(guiElemIds?.pageLastBtnId);
            this.#gui.pageInfo = document.getElementById(guiElemIds?.pageInfoId);
            this.#gui.pageFirstBtn.addEventListener("click", () => this.firstPage());
            this.#gui.pagePrevBtn.addEventListener("click", () => this.prevPage());
            this.#gui.pageNextBtn.addEventListener("click", () => this.nextPage());
            this.#gui.pageLastBtn.addEventListener("click", () => this.lastPage());
            this.#currPage = new PersistentInt(guiElemIds?.containerId + "_CurrPage", 0);
            this.#pageSize = 200;
        }

        init() {
            this.#currPage.set(0);
            this.#model.initRelevantSignals(0, this.#pageSize);
        }

        setPageSize(pageSize) {
            this.#pageSize = pageSize;
        }

        show() {
            this.#gui.container.style.visibility = "visible";
        }

        hide() {
            this.#gui.container.style.visibility = "hidden";
        }

        assess() {
            if (this.#currPage.value >= this.length()) {
                this.lastPage();
            }
            if (this.#currPage.value == 0) {
                this.#gui.pageFirstBtn.classList.add("disabled");
                this.#gui.pagePrevBtn.classList.add("disabled");
            } else {
                this.#gui.pageFirstBtn.classList.remove("disabled");
                this.#gui.pagePrevBtn.classList.remove("disabled");
            }
            if (this.isLastPage()) {
                this.#gui.pageLastBtn.classList.add("disabled");
                this.#gui.pageNextBtn.classList.add("disabled");
            } else {
                this.#gui.pageLastBtn.classList.remove("disabled");
                this.#gui.pageNextBtn.classList.remove("disabled");
            }
            this.#updateInfo();
            this.length() > 1 ? this.show() : this.hide();
        }

        #updateInfo() {
            this.#gui.pageInfo.innerHTML = (this.#currPage.value + 1) + "/" + this.length();
        }

        setCurrPage(pageIdx) {
            this.#currPage.set(pageIdx);
            this.#model.setRelevantSignals(pageIdx * this.#pageSize - (pageIdx > 0), this.#pageSize + (pageIdx > 0));
        }

        length() {
            return Math.max(1, Math.ceil((this.#model?.diag?.netSignalCount || 0) / this.#pageSize)) || 0;
        }

        nextPage() {
            this.setCurrPage(this.#currPage.value + (this.#currPage.value < this.length()-1));
        }

        prevPage() {
            this.setCurrPage(this.#currPage.value - (this.#currPage.value > 0));
        }

        firstPage() {
            this.setCurrPage(0);
        }

        lastPage() {
            this.setCurrPage(this.length()-1);
        }

        isLastPage() {
            return this.#currPage.value == this.length()-1;
        }

        goToPageOfSignal(signalIdx) {
            let pageIdx = Math.floor(signalIdx + 1 / this.#pageSize);
            if (0 <= pageIdx && pageIdx < this.length() && pageIdx != this.#currPage.value) {
                this.setCurrPage(pageIdx);
            }
        }
    }; // Paginator


    // ----- CursorDisplay -----
    static CursorDisplay = class {
        #cursor;
        #displayElem;

        constructor(cursor, displayElemId) {
            this.#displayElem = document.getElementById(displayElemId);
            this.#cursor = cursor instanceof AsdfViewModel.SignalCursor ? cursor : null;
        }

        show() {
            this.#displayElem.innerHTML = `${this.#cursor.getIdx() + 1} /<br>${this.#cursor.collectionLength()}`;
        }

        hide() {
            this.#displayElem.innerHTML = "";
        }
    }; // CursorDisplay


    // ---- Search ----
    static Search = class {
        #searchElem;
        #searchInputElem;

        constructor(searchElemId, searchInputElemId) {
            this.#searchElem = document.getElementById(searchElemId);
            this.#searchInputElem = document.getElementById(searchInputElemId);
        }

        show() {
            this.#searchElem.style.visibility = "visible";
        }

        hide() {
            this.#searchElem.style.visibility = "hidden";
        }

        blur() {
            this.#searchInputElem.blur();
        }

        isActive() {
            return document.activeElement === this.#searchInputElem;
        }

        trigger() {
            this.show();
            this.#searchInputElem.focus();
            this.#searchInputElem.select();
        }

        setPattern(pattern = "") {
            this.#searchInputElem.value = pattern;
        }

        getResults(searchSet, pattern = "") {
            this.#searchInputElem.blur();
            let searchPattern = pattern === "" ? this.#searchInputElem.value : pattern;
            if (searchPattern === "") {
                return [];
            }
            return searchSet.filter(signal =>
                                    signal.type === 'Signal' &&
                                    (signal.message.includes(searchPattern) ||
                                    signal.actorA.name.includes(searchPattern) ||
                                    signal.actorB.name.includes(searchPattern) ||
                                    (signal.meta && signal.meta.includes(searchPattern)) ||
                                    (signal.addinfo && signal.addinfo.includes(searchPattern))));
        }
    }; // Search

    // ---- HoverGate ----
    static HoverGate = class HoverGate {
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
    }; // HoverGate


    // ---- OffCanvasWrapper ----
    static OffCanvasWrapper = class {
        constructor(docElementId) {
            this.docElem = document.getElementById(docElementId);
            this.offCanvas = new bootstrap.Offcanvas(this.docElem);
        }

        toggle() {
            this.docElem.classList.contains('show') ? this.offCanvas.hide() : this.offCanvas.show();
        }
    }; // OffCanvasWrapper
}


/* ============================
 * Application Initialization
 * ============================ */
const asdfM = new AsdfModel();
const asdfVM = new AsdfViewModel(asdfM);
window.onload = () => asdfVM.init();
window.asdfVM = asdfVM;
}());
