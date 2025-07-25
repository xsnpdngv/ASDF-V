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
    fileName = new PersistentString("AsdfModel: fileName", "");
    fileSize = new PersistentInt("AsdfModel: fileSize", 0);
    fileLastMod = new PersistentInt("AsdfModel: fileLastMod", 0);
    diag = null;
    actorCount = 0;
    #signalWindow = {};
    filteredActors = new PersistentSet("AsdfModel: filteredActors");
    #diagMaster = null;
    #actorOrder = new PersistentArray("AsdfModel: actorOrder");
    #diagSrc = new PersistentString("AsdfModel: diagSrc");
    #relevantSignalStart = new PersistentInt("AsdfModel: signalStart", 0);
    #relevantSignalCount = new PersistentInt("AsdfModel: signalCount", 1000);
    #isShowIds = false;
    #isKeepOrphans = false;
    #observers = [];

    constructor() {
    }

    subscribe(observer) {
        this.#observers.push(observer);
    }

    #notify() {
        this.#observers.forEach(observer => observer.update());
    }

    init(dflt = {isShowIds: false, isKeepOrphans: false} ) {
        this.#isShowIds = dflt?.isShowIds;
        this.#isKeepOrphans = dflt?.isKeepOrphans;
        this.#loadDiagramFromSrc();
    }

    clear() {
        this.file = null;
        this.#diagSrc.set("");
        this.diag = null;
    }

    reset() {
        this.filteredActors.clear();
        this.#actorOrder.clear();
        this.#isShowIds = false;
        this.#signalWindow = {};
        this.initRelevantSignals(0, this.#relevantSignalCount.value);
        this.#reloadDiagram();
    }

    loadDiagramFromFile(file) {
        let model = this;
        model.fileName.set(file.name);
        model.fileSize.set(file.size);
        model.fileLastMod.set(file.lastModified);
        const reader = new FileReader();
        reader.onload = function(e) {
            model.#diagSrc.set(e.target.result);
            model.#loadDiagramFromSrc();
        };
        reader.readAsText(file);
    }

    sideLoadDiagram() {
        let diag = this.#cloneMaster();
        this.#removeSignalsOutsideWindow(diag);
        this.#removeSignalsOfFilteredActors(diag);
        return diag;
    }

    #loadDiagramFromSrc() {
        if (this.#diagSrc.length() > 0) {
            this.#loadMaster();
            if(this.#diagMaster instanceof Diagram) {
                this.diag = this.#cloneMaster();
                this.#signalWindow = {};
                this.#postProc();
            } else {
                this.diag = this.#diagMaster; // i.e. the error itself
            }
        }
        this.#notify();
    }

    #reloadDiagram() {
        if(this.#diagMaster instanceof Diagram) {
            this.diag = this.#cloneMaster();
            this.#postProc();
            this.#notify();
        }
    }

    #loadMaster() {
        try {
            this.#diagMaster = Diagram.parse(this.#diagSrc.value);
        } catch(e) {
            this.#diagMaster = e;
        }
        return this.#diagMaster;
    }

    #cloneMaster() {
        return this.#diagMaster.clone();
    }

    #postProc() {
        this.actorCount = this.diag.actors.length;
        this.#removeSignalsOutsideWindow(this.diag);
        this.#removeSignalsOfFilteredActors(this.diag);
        this.#countActorSignals();
        this.#removeIrrelevantSignals();
        if ( ! this.#isKeepOrphans) { this.#removeOrphanActors(); }
        this.#applyActorOrder();
        if (this.#isShowIds) { this.includeIdsInSignalMsgs(this.#isShowIds, false); }
    }

    #applyActorOrder() {
        this.#sortActors();
    }

    #sortActors() {
        const orderMap = new Map(this.#actorOrder.array.map((actorName, index) => [actorName, index]));
        this.diag.actors.sort((a, b) => { return (orderMap.get(a.name) ?? 1000) - (orderMap.get(b.name) ?? 1000); });
        this.diag.actors.forEach((a, index) => { a.index = index; });
    }

    includeIdsInSignalMsgs(isOn, isToNotify = true) {
        this.#isShowIds = isOn;
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
        this.#reloadDiagram();
    }

    setActorOrder(actorOrder) {
        this.#actorOrder.setArray(actorOrder);
        this.#reloadDiagram();
    }

    #countActorSignals() {
        this.diag.actors.forEach(a => { a.signalCount = 0; });
        this.diag.signals.forEach(s => {
            if (s.type[0] === 'S') {
                s.actorA.signalCount++;
                s.actorB.signalCount++;
            } else /* if (s.type[0] === 'N') */ {
                s.actor.signalCount++;
                if(s.addinfoHead.isSpecial) {
                    s.actor.isSpecial = true;
                }
            }
        });
        this.orphanCount = this.diag.actors.filter(a => ( (a?.signalCount || 0) <= 0 && ! this.filteredActors.has(a.name) )).length;
    }

    #removeSignalsOutsideWindow(diag) {
        if (this.#signalWindow.endIdx >= 0) {
            diag.signals.splice(this.#signalWindow.endIdx + 1);
        }
        diag.signals.splice(0, this.#signalWindow.startIdx);
        diag.windowSignalCount = diag.signals.filter(s => s.type[0] === 'S').length;
    }

    #removeSignalsOfFilteredActors(diag) {
        if ( ! diag?.signals) {
            return;
        }

        if (diag.signals.length > 0 && this.filteredActors.size() > 0 ) {
            const filteredActors = this.filteredActors.set;
            diag.signals = diag.signals.filter(signal => {
                return ! ( ( signal.type[0] === 'S' &&
                            ( filteredActors.has(signal.actorA.name) ||
                            filteredActors.has(signal.actorB.name) ) ) ||
                        ( signal.type[0] === 'N'  &&
                            filteredActors.has(signal.actor.name ) ) );
                });
        }

        if (this.#signalWindow.activeSeqNum) {
            // find active's index among the signals to be shown
            this.#signalWindow.activeIdx = diag.signals.findIndex((s) => s.seqNum === this.#signalWindow.activeSeqNum);
        }

        diag.netSignalCount = diag.signals.filter(s => s.type[0] === 'S').length;
    }

    keepOrphans(isOn) {
        this.#isKeepOrphans = isOn;
        if (this.diag) { this.#reloadDiagram(); }
    }

    #removeOrphanActors() {
        this.diag.actors = this.diag.actors.filter(a => ( !((a?.signalCount || 0) <= 0 && ! this.filteredActors.has(a.name)) ));
        this.diag.actors.forEach((a, index) => { a.index = index; });
    }

    initRelevantSignals(start, count) {
        this.#relevantSignalStart.set(start);
        this.#relevantSignalCount.set(count);
    }

    setRelevantSignals(start, count) {
        this.initRelevantSignals(start, count);
        this.#reloadDiagram();
    }

    #removeIrrelevantSignals() {
        this.diag.signals.splice(0, this.#relevantSignalStart.get());
        this.diag.signals.splice(this.#relevantSignalCount.get());
    }

    #findMasterSignalIndex(predicate) {
        return this.#diagMaster.signals.findIndex(predicate);
    }

    setSignalWindow(window = null) {
        if ( ! window?.startSeqNum && ! window.endSeqNum) {
            this.#signalWindow = {};
        }
        if (window?.startSeqNum) {
            this.#signalWindow.startIdx = this.#findMasterSignalIndex((s) => s.seqNum === window.startSeqNum);
        }
        if (window?.endSeqNum) {
            this.#signalWindow.endIdx = this.#findMasterSignalIndex((s) => s.seqNum === window.endSeqNum);
        }
        if (window?.activeSeqNum) {
            this.#signalWindow.activeSeqNum = window.activeSeqNum;
        }
        this.#reloadDiagram();
    }

    getSignalWindowActiveIdx() {
        return this.#signalWindow.activeIdx;
    }
}


/* ==============================
 * View Model: UI and Rendering
 * ============================== */
class AsdfViewModel  {
    static #TIMESTAMP_WIDTH = 45;
    #model = {}; // direct access to the model
    #diagSignals = []; // helper array of signals of original diagram (without notes)
    #diagNotes = []; // helper array of notes of original diagram
    #actorOrder = new PersistentArray("AsdfViewModel: actorOrder");
    #diagramHeadContainer = document.getElementById("diagramHeadContainer");
    #diagramContainer = document.getElementById("diagramContainer");
    #diagramDiv = document.getElementById("diagram");
    #fileInputLabel = document.getElementById("fileInputLabel");
    #isInputFileChange = false;
    #times = new AsdfViewModel.Times('times');
    #signalCursor = new AsdfViewModel.SignalCursor("AsdfViewModel-SignalCursor: signalCursor", this.#diagSignals);
    #noteCursor = new AsdfViewModel.SignalCursor("AsdfViewModel-SignalCursor: noteCursor", this.#diagNotes);
    #signalNavigator = new AsdfViewModel.SignalNavigator('path.signal', this.#signalCursor,
                                                         { diagramContainerId: "diagramContainer" },
                                                         () => this.#applySignalClick(),
                                                         this.#times);
    #toggles = {
        "showTime": new AsdfViewModel.PersistentToggle({toggleId: "showTimeToggle"}, true, this.#showTimeOnChange, this),
        "showIds": new AsdfViewModel.PersistentToggle({toggleId: "showIdsToggle"}, false, this.#showIdsOnChange, this),
        "showInstance": new AsdfViewModel.PersistentToggle({toggleId: "showInstanceToggle"}, false, this.#markSignalsHandler, this),
        "showRelated": new AsdfViewModel.PersistentToggle({toggleId: "showRelatedToggle"}, false, this.#markSignalsHandler, this),
        "showOrphans": new AsdfViewModel.PersistentToggle({toggleId: "showOrphansToggle"}, false, this.#showOrphansOnChange, this)
    }
    #signalDecorator = new AsdfViewModel.SignalDecorator({signal: 'signal', actor: 'actor'}, this.#signalCursor, this.#toggles);
    #noteDecorator = new AsdfViewModel.NoteDecorator({note: 'note', actor: 'actor'}, this.#noteCursor, this.#toggles);
    #help = new AsdfViewModel.OffCanvas("helpOffcanvas");
    #paginator;
    #search = new AsdfViewModel.Search({ searchElId: "diagramSearch",
                                         searchInputElId: "diagramSearchInput" });
    #searchHitCursor = new AsdfViewModel.SignalCursor("AsdfViewModel-SignalCursor: searchHitCursor", []);
    #searchHitCursorDisplay = new AsdfViewModel.CursorDisplay(this.#searchHitCursor, "searchStats");
    #searchHitNavigator = {};
    #divider = new AsdfViewModel.Divider({ upperAreaId: "diagramArea",
                                           lowerAreaId: "addinfoDisplay",
                                           dividerId: "divider"});
    #hoverGate = new AsdfViewModel.HoverGate();
    #participantHeader;
    #spinner = new AsdfViewModel.Spinner('spinner');
    #alerter = new AsdfViewModel.Alerter('alertPlaceholder');

    constructor(model) {
        this.#model = model;
        this.#model.subscribe(this);
        this.#hoverGate.subscribe(() => this.#showActiveSignalAddinfo());
        this.#paginator = new AsdfViewModel.Paginator( model, { containerId: "paginator",
                                                                pageFirstBtnId: "pageFirst",
                                                                pagePrevBtnId: "pagePrev",
                                                                pageNextBtnId: "pageNext",
                                                                pageLastBtnId: "pageLast",
                                                                pageInfoId: "pageInfo" },
                                                                this.#times);
        this.#searchHitNavigator = new AsdfViewModel.SearchHitNavigator(this.#search,
                                                                        this.#searchHitCursor,
                                                                        this.#searchHitCursorDisplay,
                                                                        () => { return this.#model.sideLoadDiagram()?.signals; },
                                                                        this.#paginator,
                                                                        this.#signalCursor,
                                                                        this.#signalNavigator,
                                                                        () => this.#applySignalClick(),
                                                                        this.#times);
        this.#participantHeader = new AsdfViewModel.ParticipantHeader(model, { headerContainerId: "diagramHeadContainer",
                                                                               headerDivId: "diagramHead" });
    }

    init() {
        this.#addDiagramEventListeners();
        this.#model.init({ isShowIds: this.#toggles.showIds.isOn(),
                           isKeepOrphans: this.#toggles.showOrphans.isOn()});
        this.#addDocumentEventListeners();
        this.#addScrollEventListeners();
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
        this.#model.clear();
        location.reload();
    }

    update() {
        if( this.#model.diag &&  ! (this.#model.diag instanceof Diagram)) {
            this.#handleLoadError();
            return;
        }
        this.#alerter.clear();

        this.#positionDivider();
        this.#searchHitNavigator.invalidateLastSearch();
        this.#model.diag instanceof Diagram ? this.#search.show() : this.#search.hide();
        if ( ! this.#model.diag) { return; }
        this.#saveScrollPosition();
        this.#paginator.assess();
        this.#updateToolbar();
        this.#initShowTime(this.#toggles["showTime"].isOn());

        this.#updateDiagram();
        // header must come after the diagram
        this.#participantHeader.update();
        this.#addActorMoveBtns();
        this.#addActorEventListeners();
        this.#restoreHeadScrollPosition();

        this.#signalNavigator.toCursor();
        this.#spinner.done();
    }

    #handleLoadError() {
        console.log(this.#model.diag);
        const fileLastModStr = this.#timestampToStr(this.#model.fileLastMod.get());
        this.#alerter.appendAlert(`<h5>${this.#model.fileName.get()}</h5>${fileLastModStr}<br>${this.#model.fileSize.get()} bytes <hr>`
                                  + this.#model.diag, "danger");
        this.#spinner.done();
        this.#model.clear();
    }

    #addDocumentEventListeners() {
        this.#addKeyboardShortcuts();
        window.addEventListener('resize', () => this.#syncScroll());
    }

    #addKeyboardShortcuts() {
        let vm = this;
        let keySeq = "";
        document.addEventListener("keydown", function (event) {

            if ( ! vm.#model.diag || event.metaKey || event.ctrlKey) {
                return;
            }

            vm.#hoverGate.close();

            if (vm.#search.isActive()) {
                if (event.key === "Enter") { vm.#searchHitNavigator.performSearchSignals(); }
                if (event.key === "Escape") { vm.#search.blur(); }
                return;
            } else  {
                if (event.key === "Escape") {
                    vm.#times.reset();
                    return;
                }
            }

            keySeq += event.key;

            document.activeElement.blur();

            if ('0' <= event.key && event.key <= '9') {
                if (vm.#times.n >= 100 || vm.#times.isIntact && event.key === '0') { return; }
                vm.#times.set(Number(event.key) + (vm.#times.isIntact ? 0 : vm.#times.n * 10));
            }

            let hit = true;
            if (keySeq.endsWith("re")) { vm.resetToolbarOnClick(); }
            // view
            else if (keySeq.endsWith("ti")) { vm.#toggles['showInstance'].toggle(); }
            else if (keySeq.endsWith("tr")) { vm.#toggles['showRelated'].toggle(); }
            else if (keySeq.endsWith("ts")) { vm.#toggles['showIds'].toggle(); }
            else if (keySeq.endsWith("tt")) { vm.#toggles['showTime'].toggle(); }
            else if (keySeq.endsWith("tu")) { vm.#toggles['showOrphans'].toggle(); }
            else if (event.shiftKey && event.key === "?") { vm.#help.toggle(); }
            // movement
            else if (keySeq.endsWith("ws")) { vm.#searchHitNavigator.invalidateLastSearch();
                                              vm.#paginator.setWindowStart(vm.#signalCursor.get()); }
            else if (keySeq.endsWith("we")) { vm.#searchHitNavigator.invalidateLastSearch();
                                              vm.#paginator.setWindowEnd(vm.#signalCursor.get()); }
            else if (keySeq.endsWith("ww")) { vm.#searchHitNavigator.invalidateLastSearch();
                                              vm.#paginator.resetWindow(vm.#signalCursor.get()); }
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
            else if (event.key === "n") { vm.#search.show(); vm.#searchHitNavigator.gotoNextHit(); }
            else if (event.shiftKey && event.key === "N") { vm.#search.show(); vm.#searchHitNavigator.gotoPrevHit(); }
            else if (event.shiftKey && event.key === "*") { vm.#searchHitNavigator.findOccurrence() }
            else if (event.shiftKey && event.key === "#") { vm.#searchHitNavigator.findOccurrence(-1) }
            // divider
            else if (event.shiftKey && event.key === "^") { vm.#divider.toTop(); }
            else if (event.key === "=") { vm.#divider.toCenter(); }
            else if (event.key === "-") { vm.#divider.toDefaultPos(); }
            else if (event.shiftKey && event.key === "_") { vm.#divider.toBottom(); }
            else {
                setTimeout(() => { keySeq = ""; }, 500);
                hit = false;
            }
            if (hit) {
                if (event.key < '0' || event.key > '9') { vm.#times.reset(); }
            }
        });
    }


    // ---- diagram ----
    #clearDiagram() {
        this.#diagramDiv.innerHTML = "";
        this.#participantHeader.hide();
        this.#showAddinfoContent(-1);
        this.#paginator.hide();
        this.#search.hide();
        this.#resetFileInputLabel();
        this.#searchHitNavigator.invalidateLastSearch();
        this.#model.diag instanceof Diagram ? this.#search.show() : this.#search.hide();
    }

    #updateDiagram() {
        this.#diagramDiv.innerHTML = "";
        this.#model.diag.drawSVG(this.#diagramDiv, { theme: 'simple' });
        // draws in chunks to make the UI more responsive,
        // emits 'drawComplete' event to diagramContainer if ready
    }

    #addDiagramEventListeners() {
        this.#diagramDiv.addEventListener("drawComplete", (event) => this.#diagramOnDrawComplete(event));
    }

    #diagramOnDrawComplete(event) {
        this.#restoreDiagramScrollPosition();
        this.#updateDiagSignals();
        this.#signalDecorator.draw();
        this.#sendCursorHomeOnInputFileChange();
        this.#applySignalClick();
        this.#markActors();
        this.#addSignalEventListeners();
        this.#updateDiagNotes();
        this.#noteDecorator.render();
    }

    #updateDiagSignals() {
        this.#diagSignals = this.#model.diag.signals.filter(s => s.type[0] === 'S');
        this.#signalCursor.setCollection(this.#diagSignals);
    }

    #updateDiagNotes() {
        this.#diagNotes = this.#model.diag.signals.filter(s => s.type[0] === 'N');
        this.#noteCursor.setCollection(this.#diagNotes);
    }

    // ---- scroll ----
    #addScrollEventListeners() {
        this.#diagramContainer.onscroll = () => this.#syncScroll();
    }

    #syncScroll() {
        this.#participantHeader.syncScroll(this.#diagramContainer);
	    this.#diagramHeadContainer.style.width = `${diagramContainer.clientWidth}px`; // for Edge
    }

    #resetScrollPosition() {
        const c = this.#diagramContainer;
        c.scrollLeft = 0;
        c.scrollTop = 0;
    }

    #saveScrollPosition() {
        const c = this.#diagramContainer;
        this.scrollLeft = c.scrollLeft;
        this.scrollTop = c.scrollTop;
        this.scrollWidth = c.scrollWidth;
        this.scrollHeight = c.scrollHeight;
        this.clientWidth = c.clientWidth;
        this.clientHeight = c.clientHeight;
    }

    #restoreHeadScrollPosition() {
        this.#diagramHeadContainer.scrollLeft = this.scrollLeft;
    }

    #restoreDiagramScrollPosition() {
        const c = this.#diagramContainer;
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
        this.#spinner.spin();
        this.#alerter.clear();
        this.#paginator.init();
        this.#diagramContainer.scrollTop = 0;
        this.#model.loadDiagramFromFile(event.target.files[0]);
        this.#isInputFileChange = true;
        this.#clearDiagram();
    }

    #updateFileInputLabel() {
        let fil = this.#fileInputLabel
        const filteredActorCount = this.#model.diag.actors.filter(actor => this.#model.filteredActors.has(actor.name)).length;
        fil.textContent = this.#model.fileName.get() + "\n";
        fil.textContent += this.#model.actorCount;
        if (filteredActorCount > 0 || this.#model.orphanCount > 0) {
            fil.textContent += ` pts (`
            if (filteredActorCount > 0) {
                fil.textContent += `${filteredActorCount} filtered`;
                if (this.#model.orphanCount > 0) {
                    fil.textContent += ", ";
                }
            }
            fil.textContent += (this.#model.orphanCount > 0 ? `${this.#model.orphanCount} unlinked` : "");
            fil.textContent += ")";
        } else {
            fil.textContent += " participants";
        }
        let d = this.#model.diag;
        fil.textContent += "\n" + d.signalCount;
        fil.textContent += ' signals';
        if (d.windowSignalCount < d.signalCount ||
            d.netSignalCount < d.windowSignalCount) {
            fil.textContent += " (";
            if (d.windowSignalCount < d.signalCount) {
                fil.textContent += `${d.signalCount - d.windowSignalCount} dropped`;
                if (d.netSignalCount < d.windowSignalCount) {
                    fil.textContent += ", ";
                }
            }
            if (d.netSignalCount < d.windowSignalCount) {
                fil.textContent += d.netSignalCount + " shown";
            }
            fil.textContent += ")";
        }
    }

    #resetFileInputLabel() {
        this.#fileInputLabel.innerHTML = "open";
    }

    #showTimeOnChange(vm, isOn) {
        vm.#initShowTime(isOn);
        vm.update();
    }

    #initShowTime(isOn) {
        if (this.#model.diag) {
            this.#model.diag.setOffsetX(isOn ? AsdfViewModel.#TIMESTAMP_WIDTH : 0);
        }
    }

    #showIdsOnChange(vm, isOn) {
        vm.#model.includeIdsInSignalMsgs(isOn);
    }

    #showOrphansOnChange(vm, isOn) {
        vm.#model.keepOrphans(isOn);
    }

    #markSignalsHandler(vm) {
        vm.#signalDecorator.mark();
    }

    resetToolbarOnClick() {
        this.#alerter.clear();
        Object.entries(this.#toggles).forEach(([key, value]) => { value.reset(); });
        this.#times.reset();
        this.#resetScrollPosition();
        this.#paginator.init();
        this.#diagramContainer.scrollTop = 0;
        this.#signalCursor.set(1);
        this.#model.reset();
        if (this.#model.diag) { this.#divider.toDefaultPos(); }
    }

    // ---- signal ----
    #sendCursorHomeOnInputFileChange() {
        if (this.#isInputFileChange) { this.#signalCursor.home(); this.#isInputFileChange = false; }
    }

    #addSignalEventListeners() {
        const arrowTexts = document.querySelectorAll('text.signal');
        arrowTexts.forEach((txt, index) => {
            txt.onclick = () => this.#signalTextOnClick(index);
            txt.onmouseenter = () => { if (this.#hoverGate.isOpen()) { this.#showAddinfoContent(index); } };
            txt.onmouseleave = () => { if (this.#hoverGate.isOpen()) { this.#showActiveSignalAddinfo(); } };
        });
    }

    #signalTextOnClick(index) {
        if(this.#signalCursor.getIdx() == index) {
            this.#signalCursor.set(-1);
        } else {
            this.#signalCursor.setByIdx(index);
        }
        this.#applySignalClick();
    }

    #applySignalClick() {
        this.#showActiveSignalAddinfo();
        this.#signalDecorator.mark();
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
        if (index < this.#diagSignals.length) {
            const s = this.#diagSignals[index];
            notation.textContent = `${s.seqNum}. ${s.actorA.alias} -> ${s.actorB.alias}: ${s.message}`;
            meta.textContent = s.meta;
            addinfo.textContent = s.addinfo;
        }
    }

    #showActiveSignalAddinfo() {
        this.#showAddinfoContent(this.#signalCursor.getIdx());
    }

    // ---- actor ----
    #addActorEventListeners() {
        const headActorTexts = document.querySelectorAll('text.head-actor');
        // const actorTexts = document.querySelectorAll('text.actor');

        this.#actorOrder.clear();
        this.#model.diag.actors.forEach((a, i) => {
            this.#actorOrder.add(a.name);
            if (a.signalCount > 0 || this.#model.filteredActors.has(a.name)) {
                headActorTexts[i].onclick = () => this.#actorTextOnClick(i);
                // actorTexts[2*i].onclick = () => this.#actorTextOnClick(i);
                // actorTexts[2*i+1].onclick = () => this.#actorTextOnClick(i);
            }
        });
    }

    #actorTextOnClick(index) {
        this.#participantHeader.flashActorOnUpdate(index);
        this.#model.toggleActor(index);
    }

    #addActorMoveBtns() {
        this.#addMoveBtnsToElemList('rect.head-actor');
        // this.#addMoveBtnsToElemList('rect.actor.top');
        // this.#addMoveBtnsToElemList('rect.actor.bottom');
    }

    #addMoveBtnsToElemList(uiElemId) {
        const elemList = document.querySelectorAll(uiElemId)
        elemList.forEach((elem, index) => {
            const rectX = parseFloat(elem.getAttribute('x'));
            const rectY = parseFloat(elem.getAttribute('y'));
            if (index > 0) {
                elem.parentNode.append( AsdfViewModel.ParticipantMoveBtn.create(rectX-8, rectY+11, 'left', () => this.#moveActor(index, index - this.#times.n)) );
            }
            if (index < this.#model.diag.actors.length - 1) {
                const rectWidth = parseFloat(elem.getAttribute('width'));
                elem.parentNode.append( AsdfViewModel.ParticipantMoveBtn.create(rectX+rectWidth-8, rectY+11, 'right', () => this.#moveActor(index, index + this.#times.n)) );
            }
        });
    }

    static ParticipantMoveBtn = class {
        static create(x, y, dir, onclick = () => {}) {
            const moveBtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            moveBtn.setAttribute("width", "16");
            moveBtn.setAttribute("height", "16");
            moveBtn.setAttribute("fill", "currentColor");
            moveBtn.setAttribute("class", "move move-" + dir);
            moveBtn.innerHTML = dir == 'left' ? `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>`
                                  /* right */ : `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>`;
            moveBtn.setAttribute("x", x);
            moveBtn.setAttribute("y", y);
            moveBtn.onclick = onclick;
            return moveBtn;
        }
    }

    #moveActor(fromIndex, toIndex) {
        if (toIndex >= this.#actorOrder.length()) { toIndex = this.#actorOrder.length() - 1; }
        if (toIndex < 0) { toIndex = 0; }
        this.#participantHeader.flashActorOnUpdate(fromIndex);
        this.#actorOrder.move(fromIndex, toIndex);
        this.#model.setActorOrder(this.#actorOrder.array);
    }

    #markActors() {
        const actorPaths = document.querySelectorAll('path.actor');
        const actorBoxes = document.querySelectorAll('rect.actor');
        const actorTexts = document.querySelectorAll('text.actor');

        this.#model.diag.actors.forEach((a, i) => {
            let cl = 'filtered';
            if (this.#model.filteredActors.has(this.#model.diag.actors[i].name)) {
                actorBoxes[2*i].classList.add(cl);
                actorBoxes[2*i+1].classList.add(cl);
                actorTexts[2*i].classList.add(cl);
                actorTexts[2*i+1].classList.add(cl);
                actorPaths[i].classList.add(cl);
            }
            cl = 'orphan';
            if (a.signalCount == 0) {
                actorBoxes[2*i].classList.add(cl);
                actorBoxes[2*i+1].classList.add(cl);
                actorTexts[2*i].classList.add(cl);
                actorTexts[2*i+1].classList.add(cl);
                actorPaths[i].classList.add(cl);
            }
            cl = 'special';
            if (a.isSpecial) {
                actorBoxes[2*i].classList.add(cl);
                actorBoxes[2*i+1].classList.add(cl);
                actorTexts[2*i].classList.add(cl);
                actorTexts[2*i+1].classList.add(cl);
                actorPaths[i].classList.add(cl);
            }
        });
    }

    #positionDivider() {
        if ( ! this.#model.diag) { this.#divider.toBottom(); }
        else if ( ! this.wasDiag) { this.#divider.toDefaultPos(); }
        this.wasDiag = !! this.#model.diag;
    }

    #timestampToStr(ts) {
        const lastMod = new Date(ts);
        const str = lastMod.getFullYear() + '-' +
                    String(lastMod.getMonth()+1).padStart(2, '0') + '-' +
                    String(lastMod.getDate()).padStart(2, '0') + ' ' +
                    lastMod.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return str;
    }


    // ====== auxiliary inner classes ======


    // ---- PersistentToggle ----
    static PersistentToggle = class {
        #gui = {};
        #value = {};
        #onChangeHandler = () => {};
        #onChangeArg = null;

        constructor(guiIds, defaultValue, onChangeHandler = () => {}, onChangeArg = null) {
            this.#value = new PersistentBool("AsdfViewModel-PersistentToggle: " + guiIds?.toggleId, defaultValue);
            this.#onChangeHandler = onChangeHandler;
            this.#onChangeArg = onChangeArg;
            this.#gui.toggle = document.getElementById(guiIds?.toggleId) || {};
            this.#gui.toggle.checked = this.#value.get();
            this.#gui.toggle.onchange = () => this.set(this.#gui.toggle.checked);
        }

        toggle() {
            this.set( ! this.isOn())
        }

        isOn() {
            return this.#value.get();
        }

        set(isOn) {
            this.#value.set(isOn);
            this.#gui.toggle.checked = isOn;
            this.#onChangeHandler(this.#onChangeArg, isOn);
        }

        reset() {
            this.#value.reset();
            // let the handler be invoked on update
            this.#gui.toggle.checked = this.#value.get();
        }
    }; // PersistentToggle


    // ---- ParticipantHeader ----
    static ParticipantHeader = class ParticipantHeader {
        #model = null;
        #gui = {};
        #actorToFlash = null;

        constructor(model, guiIds) {
            this.#model = model;
            this.#gui.participantHeaderContainer = document.getElementById(guiIds?.headerContainerId);
            this.#gui.participantHeaderDiv = document.getElementById(guiIds?.headerDivId);
        }

        update() {
            this.#gui.participantHeaderDiv.innerHTML = "";
            this.#model.diag.drawHeader(this.#gui.participantHeaderDiv);
            this.#gui.participantHeaderContainer.style.setProperty("--asdf-head-height", this.#model.diag.headerHeight + "px");
            this.#markActors();
            this.show();
        }

        #markActors() {
            const headActorBoxes = document.querySelectorAll('rect.head-actor');
            const headActorTexts = document.querySelectorAll('text.head-actor');

            this.#model.diag.actors.forEach((a, i) => {
                let cl = 'filtered';
                if (this.#model.filteredActors.has(this.#model.diag.actors[i].name)) {
                    headActorBoxes[i].classList.add(cl);
                    headActorTexts[i].classList.add(cl);
                }
                cl = 'orphan';
                if (a.signalCount == 0) {
                    headActorBoxes[i].classList.add(cl);
                    headActorTexts[i].classList.add(cl);
                }
                cl = 'special';
                if (a.isSpecial) {
                    headActorBoxes[i].classList.add(cl);
                    headActorTexts[i].classList.add(cl);
                }
            });
            if (this.#actorToFlash) {
                const a = this.#model.diag.actors.find(a => a.name === this.#actorToFlash);
                if (a) { AsdfViewModel.FlashIndicator.flashOnce(headActorBoxes[a.index]); }
                this.#actorToFlash = null;
            }
        }

        show() {
            this.#gui.participantHeaderContainer.style.visibility = "visible";
        }

        hide() {
            this.#gui.participantHeaderContainer.style.visibility = "hidden";
        }

        syncScroll(to) {
            this.#gui.participantHeaderContainer.scrollLeft = to?.scrollLeft || 0;
        }

        flashActorOnUpdate(index) {
            this.#actorToFlash = this.#model.diag.actors[index].name;
        }
    }; // ParticipantHeader


    // ---- Divider -----
    static Divider = class {
        #gui = {};
        #isResizing = false;
        #startY = 0;
        #startUpperAreaHeight = 0;

        constructor(guiIds) {
            this.#gui.upperArea = document.getElementById(guiIds?.upperAreaId) || {};
            this.#gui.lowerArea = document.getElementById(guiIds?.lowerAreaId) || {};
            this.#gui.divider = document.getElementById(guiIds?.dividerId) || {};
            this.#addEventListeners();
        }

        #addEventListeners() {
            document.onmousemove = (e) => this.#documentOnMouseMove(e);
            document.onmouseup = () => this.#documentOnMouseUp();
            this.#gui.divider.onmousedown = (e) => this.#dividerOnMouseDown(e);
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
                    this.#gui.upperArea.style.height = `${upperAreaHeight}%`;
                    this.#gui.lowerArea.style.height = `${lowerAreaHeight}%`;
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
            this.#gui.upperArea.style.height = `${upperAreaHeight}%`;
            this.#gui.lowerArea.style.height = `${lowerAreaHeight}%`;
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
        seqNum = -1;
        #cursorSeqNum = null;
        #collection = [];

        constructor(name, collection = []) {
            this.setCollection(collection);
            this.#cursorSeqNum = new PersistentInt(name, -1);
            this.seqNum = this.#cursorSeqNum.value;
        }

        setCollection(collection = []) {
            this.#collection = Array.isArray(collection) ? collection : [];
        }

        getCollection() {
            return this.#collection;
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

        getHomeSignal() {
            return this.collectionLength() > 0 ? this.#collection[0] : null;
        }

        getSignal() {
            return this.getSignalByIdx(this.getIdx());
        }

        getSignalByIdx(idx) {
            return this.#isIndexValid(idx) ? this.#collection[idx] : null;
        }

        getEndSignal() {
            return this.collectionLength() > 0 ? this.#collection[this.collectionLength()-1] : null;
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


    // ---- SignalDecorator ----
    static SignalDecorator = class SignalDecorator {
        static #TIMESTAMP_CLASSNAME = "ts";
        static #GRIDLINE_CLASSNAME = "gridline";
        static #SEQNUM_CLASSNAME = "seq-num";
        static #SEQNUM_CIRCLE_RADIUS = 13;
        #selectors = { signal: "", actor: "" };
        #cursor = {};
        #toggles = [];

        constructor(selectors, signalCursor, toggles) {
            this.#selectors = selectors;
            this.#cursor = signalCursor instanceof AsdfViewModel.SignalCursor ? signalCursor : null;
            this.#toggles = toggles;
        }

        render() {
            this.draw();
            this.mark();
        }

        draw() {
            this.drawSeqNumCircles();
            this.drawTimestamps();
        }

        mark() {
            this.markArrowTexts();
            this.markTimestamps();
        }

        drawSeqNumCircles() {
            const arrowPaths = document.querySelectorAll("path." + this.#selectors.signal);
            const signals = this.#cursor.getCollection();

            arrowPaths.forEach((path, index) => {
                const start = path.getPointAtLength(0);

                let sn = signals[index].seqNum;
                const widener = ( sn > 99_999 ? 5 : ( sn > 9_999 ? 3 : 0 ) );
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                circle.setAttribute("cx", start.x);
                circle.setAttribute("cy", start.y);
                circle.setAttribute("rx", SignalDecorator.#SEQNUM_CIRCLE_RADIUS + widener);
                circle.setAttribute("ry", SignalDecorator.#SEQNUM_CIRCLE_RADIUS);
                circle.setAttribute("class", SignalDecorator.#SEQNUM_CLASSNAME);

                const text = Object.assign(document.createElementNS("http://www.w3.org/2000/svg", "text"), { textContent: sn });
                text.setAttribute("x", start.x);
                text.setAttribute("y", start.y);
                text.setAttribute("dy", "0.35em");
                text.setAttribute("class", SignalDecorator.#SEQNUM_CLASSNAME);

                path.parentNode.append(circle, text);
            });
        }

        drawTimestamps() {
            if ( ! this.#toggles['showTime'].isOn()) {
                return;
            }

            const arrowPaths = document.querySelectorAll("path." + this.#selectors.signal);
            const actorPaths = document.querySelectorAll("path." + this.#selectors.actor);
            const signals = this.#cursor.getCollection();

            if (arrowPaths.length < 1) {
                return;
            }

            let svg = arrowPaths[0].parentNode;
            // add a background layer to append gridlines to
            const bkgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            svg.insertBefore(bkgGroup, svg.firstChild);

            const gridlineWidth = actorPaths[actorPaths.length-1].getPointAtLength(0).x;
            arrowPaths.forEach((path, index) => {
                const start = path.getPointAtLength(0);

                const ts = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ts.setAttribute("x", 0);
                ts.setAttribute("y", start.y-6);
                ts.setAttribute("class", SignalDecorator.#TIMESTAMP_CLASSNAME);
                ts.textContent = signals[index]?.addinfoHead?.timestamp?.split('T')[1] || "";

                const gridline = document.createElementNS("http://www.w3.org/2000/svg", "path");
                gridline.setAttribute("d", `M${0},${start.y} h${gridlineWidth}`);
                gridline.setAttribute("class", SignalDecorator.#GRIDLINE_CLASSNAME);

                bkgGroup.append(gridline, ts);
            });
        }

        markArrowTexts() {
            const arrowTexts = document.querySelectorAll("text." + this.#selectors.signal);
            const seqNumTexts = document.querySelectorAll("text." + SignalDecorator.#SEQNUM_CLASSNAME);
            const seqNumCircles = document.querySelectorAll("ellipse." + SignalDecorator.#SEQNUM_CLASSNAME);

            let refIndex = this.#cursor.getIdx();
            let refSig = this.#cursor.getSignal() || { "addinfoHead": { "srcInstanceId": null,
                                                                        "dstInstanceId": null } };
            const isShowInstance = this.#toggles["showInstance"].isOn();
            const isShowRelated = this.#toggles["showRelated"].isOn();

            this.#cursor.getCollection().forEach((s, i) => {
                let text = arrowTexts[i];
                let circle = seqNumCircles[i];
                let seqNum = seqNumTexts[i];

                let isOfSameInstance = false;
                let isRelated = false;
                let cl = '';
                let method = 'add';

                cl = 'instance';
                isOfSameInstance = refSig.addinfoHead.srcInstanceId &&
                                   s.addinfoHead.srcInstanceId === refSig.addinfoHead.srcInstanceId;
                method = (isOfSameInstance && isShowInstance) ? 'add' : 'remove';
                text.classList[method](cl);
                circle.classList[method](cl);
                seqNum.classList[method](cl);

                cl = 'related';
                isRelated = isOfSameInstance ||
                            ( refSig.addinfoHead.srcInstanceId &&
                              s.addinfoHead.dstInstanceId === refSig.addinfoHead.srcInstanceId ) ||
                            ( refSig.addinfoHead.dstInstanceId &&
                              s.addinfoHead.srcInstanceId === refSig.addinfoHead.dstInstanceId );
                method = (isRelated && isShowRelated) ? 'add' : 'remove';
                text.classList[method](cl);
                circle.classList[method](cl);
                seqNum.classList[method](cl);

                if (s?.addinfoHead && (s.addinfoHead?.isSpecial || s.addinfoHead?.size <= 0)) {
                    text.classList.add("special");
                }

                cl = 'active';
                method = (i === refIndex) ? 'add' : 'remove';
                text.classList[method](cl);
                circle.classList[method](cl);
                seqNum.classList[method](cl);
            });
        }

        markTimestamps() {
            const timestamps = document.querySelectorAll("text." + SignalDecorator.#TIMESTAMP_CLASSNAME);
            const gridlines = document.querySelectorAll("path." + SignalDecorator.#GRIDLINE_CLASSNAME);
            timestamps?.forEach(ts => { ts.classList.remove('active'); });
            gridlines?.forEach(gl => { gl.classList.remove('active'); });
            if (this.#cursor.isValid() && timestamps.length > 0) {
                timestamps[this.#cursor.getIdx()].classList.add('active');
                gridlines[this.#cursor.getIdx()].classList.add('active');
            }
        }
    }; // SignalDecorator


    // ---- NoteDecorator ----
    static NoteDecorator = class NoteDecorator {
        static #TIMESTAMP_CLASSNAME = "note-ts";
        static #GRIDLINE_CLASSNAME = "note-gridline";
        #selectors = { note: "", actor: "" };
        #cursor = {};
        #toggles = [];

        constructor(selectors, noteCursor, toggles) {
            this.#selectors = selectors;
            this.#cursor = noteCursor instanceof AsdfViewModel.SignalCursor ? noteCursor : null;
            this.#toggles = toggles;
        }

        render() {
            this.draw();
            this.mark();
        }

        draw() {
            this.drawTimestamps();
        }

        mark() {
            this.markNoteBoxes();
            this.markNoteTexts();
        }

        drawTimestamps() {
            if ( ! this.#toggles['showTime'].isOn()) {
                return;
            }

            const noteBoxes = document.querySelectorAll("rect." + this.#selectors.note);
            const actorPaths = document.querySelectorAll("path." + this.#selectors.actor);
            const notes = this.#cursor.getCollection();

            if (noteBoxes.length < 1) {
                return;
            }

            let svg = noteBoxes[0].parentNode;
            // add a background layer to append gridlines to
            const bkgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            svg.insertBefore(bkgGroup, svg.firstChild);

            const gridlineWidth = actorPaths[actorPaths.length-1].getPointAtLength(0).x;
            noteBoxes.forEach((rect, index) => {
                const y = parseFloat(rect.getAttribute("y"));
                const h = parseFloat(rect.getAttribute("height"));

                const ts = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ts.setAttribute("x", 0);
                ts.setAttribute("y", y+(h/2)-6);
                ts.setAttribute("class", NoteDecorator.#TIMESTAMP_CLASSNAME);
                ts.textContent = notes[index]?.addinfoHead?.timestamp?.split('T')[1] || "";

                const gridline = document.createElementNS("http://www.w3.org/2000/svg", "path");
                gridline.setAttribute("d", `M${0},${y+(h/2)} h${gridlineWidth}`);
                gridline.setAttribute("class", NoteDecorator.#GRIDLINE_CLASSNAME);

                bkgGroup.append(gridline, ts);
            });
        }

        markNoteTexts() {
            const noteTexts = document.querySelectorAll("text." + this.#selectors.note);

            this.#cursor.getCollection().forEach((s, i) => {
                let text = noteTexts[i];

                if (s?.addinfoHead && s.addinfoHead?.isSpecial) {
                    text.classList.add("special");
                }
            });
        }

        markNoteBoxes() {
            const noteBoxes = document.querySelectorAll("rect." + this.#selectors.note);

            this.#cursor.getCollection().forEach((s, i) => {
                let text = noteBoxes[i];

                if (s?.addinfoHead && s.addinfoHead?.isSpecial) {
                    text.classList.add("special");
                }
            });
        }
    }; // NoteDecorator


    // ---- SignalNavigator ----
    static SignalNavigator = class SignalNavigator {
        static #HEAD_HEIGHT = 59;
        static #MARGIN = 100;
        #signalPathClassName = "";
        #signalCursor = {};
        #signalSelectAction = () => {};
        #gui = {};
        #times = { n: 1 };

        constructor(signalPathClassName, signalCursor, guiElemIds, signalSelectAction = () => {}, times = null) {
            this.#signalPathClassName = signalPathClassName;
            this.#signalCursor = signalCursor instanceof AsdfViewModel.SignalCursor ? signalCursor : null;
            this.#gui.diagramContainer = document.getElementById(guiElemIds?.diagramContainerId);
            this.#signalSelectAction = signalSelectAction;
            if (times) { this.#times = times; }
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
            if ( ! this.#times.isIntact) {
                this.#signalCursor.home();
                for (let i = 0; i < this.#times.n - 1; ++i) {
                    this.#toNext();
                }
            }
            this.toCursor();
            this.#signalSelectAction();
        }

        toNext(isShift = false) {
            for (let i = 0; i < this.#times.n; ++i) {
                this.#toNext(isShift);
            }
        }

        #toNext(isShift = false) {
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
            for (let i = 0; i < this.#times.n; ++i) {
                this.#toPrev(isShift);
            }
        }

        #toPrev(isShift = false) {
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
        #gui = {};
        #model = {};
        #pageSize = 200;
        #currPage = new PersistentInt("AsdfViewModel-Paginator: currPage", 0);
        #times = { n: 1 };

        constructor(model, guiElemIds = {}, times = null) {
            this.#model = model;
            this.#gui.container = document.getElementById(guiElemIds?.containerId) || {};
            this.#gui.pageFirstBtn = document.getElementById(guiElemIds?.pageFirstBtnId) || {};
            this.#gui.pagePrevBtn = document.getElementById(guiElemIds?.pagePrevBtnId) || {};
            this.#gui.pageNextBtn = document.getElementById(guiElemIds?.pageNextBtnId) || {};
            this.#gui.pageLastBtn = document.getElementById(guiElemIds?.pageLastBtnId) || {};
            this.#gui.pageInfo = document.getElementById(guiElemIds?.pageInfoId) || {};
            this.#gui.pageFirstBtn.addEventListener("click", () => this.firstPage());
            this.#gui.pagePrevBtn.addEventListener("click", () => this.prevPage());
            this.#gui.pageNextBtn.addEventListener("click", () => this.nextPage());
            this.#gui.pageLastBtn.addEventListener("click", () => this.lastPage());
            if (times) { this.#times = times; }
        }

        init() {
            this.#currPage.set(0);
            this.#model.initRelevantSignals(0, this.#pageSize);
        }

        setPageSize(pageSize) {
            this.#pageSize = pageSize;
            this.assess();
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
            if (pageIdx >= this.length()-1) { pageIdx = this.length()-1; }
            if (pageIdx < 0) { pageIdx = 0; }
            this.#currPage.set(pageIdx);
            this.#model.setRelevantSignals(pageIdx * this.#pageSize - (pageIdx > 0), this.#pageSize + (pageIdx > 0));
        }

        setWindowStart(startSeqNum) {
            this.#currPage.set(0);
            this.#model.initRelevantSignals(0, this.#pageSize);
            this.#model.setSignalWindow({ startSeqNum: startSeqNum });
        }

        setWindowEnd(endSeqNum) {
            this.#model.setSignalWindow({ endSeqNum: endSeqNum });
        }

        resetWindow(activeSeqNum) {
            this.#model.setSignalWindow({ activeSeqNum: activeSeqNum });
            this.goToPageOfSignal( this.#model.getSignalWindowActiveIdx() );
        }

        length() {
            return Math.max(1, Math.ceil((this.#model?.diag?.netSignalCount || 0) / this.#pageSize)) || 0;
        }

        nextPage() {
            this.setCurrPage(this.#currPage.value + (this.#currPage.value < this.length()-1) * this.#times.n);
        }

        prevPage() {
            this.setCurrPage(this.#currPage.value - (this.#currPage.value > 0) * this.#times.n);
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
            let pageIdx = Math.floor(signalIdx / this.#pageSize);
            if (0 <= pageIdx && pageIdx < this.length() && pageIdx != this.#currPage.value) {
                this.setCurrPage(pageIdx);
            }
        }

        getShownSignals() {
            return this.#model.diag.signals.filter(s => s.type[0] === 'S');
        }
    }; // Paginator


    // ----- CursorDisplay -----
    static CursorDisplay = class {
        #cursor = {};
        #gui = {};

        constructor(cursor, displayElId) {
            this.#gui.display = document.getElementById(displayElId) || {};
            this.#cursor = cursor instanceof AsdfViewModel.SignalCursor ? cursor : null;
        }

        show() {
            this.#gui.display.innerHTML = `${this.#cursor.getIdx() + 1} /<br>${this.#cursor.collectionLength()}`;
        }

        hide() {
            this.#gui.display.innerHTML = "";
        }
    }; // CursorDisplay


    // ---- Search ----
    static Search = class {
        #gui = {}

        constructor(guiElIds) {
            this.#gui.search = document.getElementById(guiElIds?.searchElId) || {};
            this.#gui.searchInput = document.getElementById(guiElIds?.searchInputElId) || {};
        }

        show() {
            this.#gui.search.style.visibility = "visible";
        }

        hide() {
            this.#gui.search.style.visibility = "hidden";
        }

        blur() {
            this.#gui.searchInput.blur();
        }

        isActive() {
            return document.activeElement === this.#gui.searchInput;
        }

        trigger() {
            this.show();
            this.#gui.searchInput.focus();
            this.#gui.searchInput.select();
        }

        setPattern(pattern = "") {
            this.#gui.searchInput.value = pattern;
        }

        getResults(searchSet, pattern = "") {
            this.#gui.searchInput.blur();
            let searchPattern = pattern === "" ? this.#gui.searchInput.value : pattern;
            if (searchPattern === "") {
                return [];
            }
            return searchSet.filter(signal =>
                                    signal.type[0] === 'S' &&
                                    (signal.message.includes(searchPattern) ||
                                    signal.actorA.name.includes(searchPattern) ||
                                    signal.actorB.name.includes(searchPattern) ||
                                    (signal.meta && signal.meta.includes(searchPattern)) ||
                                    (signal.addinfo && signal.addinfo.includes(searchPattern))));
        }
    }; // Search


    // ---- SearchHitNavigator ----
    static SearchHitNavigator = class {
        #search;
        #sigCursor;
        #hitCursor;
        #getSearchSet;
        #searchSet = null;
        #display;
        #pager;
        #sigNav;
        #sigSelAct = () => {};
        #times = { n: 1 };

        constructor(search, searchHitCursor, searchHitDisplay, getSearchSet, paginator, signalCursor, signalNavigator, signalSelectAction = () => {}, times = null) {
            this.#search = search;
            this.#sigCursor = signalCursor instanceof AsdfViewModel.SignalCursor ? signalCursor : null;
            this.#hitCursor = searchHitCursor instanceof AsdfViewModel.SignalCursor ? searchHitCursor : null;
            this.#display = searchHitDisplay instanceof AsdfViewModel.CursorDisplay ? searchHitDisplay : null;
            this.#getSearchSet = getSearchSet;
            this.#pager = paginator instanceof AsdfViewModel.Paginator ? paginator : null;
            this.#sigNav = signalNavigator instanceof AsdfViewModel.SignalNavigator ? signalNavigator : null;
            this.#sigSelAct = signalSelectAction;
            if (times) { this.#times = times };
        }

        performSearchSignals(dir = 1) {
            this.#hitCursor.reset();
            this.#searchSet = this.#getSearchSet();
            this.#hitCursor.setCollection(this.#search.getResults(this.#searchSet));
            this.#display.show();
            dir < 0 ? this.gotoPrevHit() : this.gotoNextHit();
        }

        invalidateLastSearch() {
            this.#searchSet = null;
            this.#display.hide();
        }

        gotoCurrHit(dir = 1) {
            if ( ! this.#searchSet) {
                this.performSearchSignals(dir);
                return;
            }
            this.#sigCursor.set(this.#hitCursor.seqNum);
            this.#pager.goToPageOfSignal(this.#globalIndexOf(this.#hitCursor.seqNum, this.#searchSet));
            this.#display.show();
            setTimeout(() => {
                this.#sigNav.toCursor();
                this.#sigSelAct();
            }, 0); // let paging happen before
        }

        gotoNextHit() {
            if (this.#searchSet && this.#hitCursor.collectionLength() < 1) {
                return;
            }
            this.#hitCursor.home();
            const limit = this.#sigCursor.isValid() ? this.#sigCursor.seqNum
                                                    : (this.#sigCursor.getHomeSignal()?.seqNum || 0) - 1;
            while (this.#hitCursor.get() <= limit) {
                if (this.#hitCursor.isAtEnd()) {
                    this.#hitCursor.home();
                    break;
                }
                this.#hitCursor.next();
            }
            for (let i = 0; i < this.#times.n - 1; ++i) {
                this.#hitCursor.next();
            }
            this.gotoCurrHit();
        }

        gotoPrevHit() {
            if (this.#searchSet && this.#hitCursor.collectionLength() < 1) {
                return;
            }
            this.#hitCursor.end();
            const limit = this.#sigCursor.isValid() ? this.#sigCursor.seqNum
                                                    : (this.#sigCursor.getEndSignal()?.seqNum || 0) + 1;
            while (this.#hitCursor.seqNum >= limit) {
                if (this.#hitCursor.isAtHome()) {
                    this.#hitCursor.end();
                    break;
                }
                this.#hitCursor.prev();
            }
            for (let i = 0; i < this.#times.n - 1; ++i) {
                this.#hitCursor.prev();
            }
            this.gotoCurrHit(-1);
        }

        findOccurrence(dir = 1) {
            if ( ! this.#sigCursor.isValid()) {
                return;
            }
            this.#search.show();
            this.#search.setPattern(this.#sigCursor.getSignal().message);
            this.performSearchSignals(dir);
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
    }; // SearchHitNavigator


    // ---- HoverGate ----
    static HoverGate = class HoverGate {
        #isOpen = true;
        #callbacks = [];

        constructor() {}

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


    // ---- OffCanvas
    static OffCanvas = class {
        #gui = {};
        #offCanvas = {};

        constructor(guiElId) {
            this.#gui.doc = document.getElementById(guiElId);
            this.#offCanvas = new bootstrap.Offcanvas(this.#gui.doc);
        }

        toggle() {
            this.#gui.doc.classList.contains('show') ? this.#offCanvas.hide() : this.#offCanvas.show();
        }
    }; // OffCanvas


    // ---- FlashIndicator ----
    static FlashIndicator = class FlashIndicator {
        static flashOnce(element) {
            if (!element) {
                return;
            }
            element.classList.add('flash-once');
            setTimeout(() => { element.classList.remove('flash-once');
            }, 2000);
        }
    }; // FlashIndicator


    static Times = class {
        n = 1;
        isIntact = true;
        #guiEl;

        constructor(guiElId) {
            this.#guiEl = document.getElementById(guiElId);
        }

        set(n) {
            this.n = n;
            this.#guiEl.innerHTML = `${n}x`;
            this.isIntact = false;
        }

        reset() {
            this.n = 1;
            this.#guiEl.innerHTML = "";
            this.isIntact = true;
        }
    };


    static Spinner = class {
        #guiEl;

        constructor(guiElId) {
            this.#guiEl = document.getElementById(guiElId);
        }

        spin() {
            this.#guiEl.style.visibility = 'visible';
        }

        done() {
            this.#guiEl.style.visibility = 'hidden';
        }
    };


    static Alerter = class Alerter {
        #guiEl;

        constructor(guiElId) {
            this.#guiEl = document.getElementById(guiElId);
        }

        appendAlert(message, type) {
            const wrapper = document.createElement('div')
            wrapper.innerHTML = [
                `<div class="alert alert-${type} alert-dismissible" role="alert">`,
                `   <div><pre>${message}</pre></div>`,
                // '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
                '</div>'
            ].join('')

            this.#guiEl.append(wrapper)
        }

        clear() {
            this.#guiEl.innerHTML = "";
        }
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
