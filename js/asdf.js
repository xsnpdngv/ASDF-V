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
    // Constructor accepts a key for storing/retrieving data from localStorage
    constructor(key) {
        this.key = key;
        this.array = this.#loadArrayFromLocalStorage();
    }

    // Private method to load array from localStorage
    #loadArrayFromLocalStorage() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    // Private method to save array to localStorage
    #saveArrayToLocalStorage() {
        localStorage.setItem(this.key, JSON.stringify(this.array));
    }

    // Add a new element to the array
    add(value) {
        this.array.push(value);
        this.#saveArrayToLocalStorage();
    }

    // Remove an element by index
    remove(index) {
        if (index >= 0 && index < this.array.length) {
            this.array.splice(index, 1);
            this.#saveArrayToLocalStorage();
        }
    }
    // Get the array (this will allow you to pass it to printParticipants)
    getArray() {
        return this.array;
    }

    // Get element at specific index
    get(index) {
        return this.array[index];
    }

    // Get the length of the array
    length() {
        return this.array.length;
    }

    // Move an element from one index to another
    move(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.array.length && toIndex >= 0 && toIndex < this.array.length) {
            const [item] = this.array.splice(fromIndex, 1); // Remove item from original position
            this.array.splice(toIndex, 0, item); // Insert item at the new position
            this.#saveArrayToLocalStorage();
        }
    }

    // Move item to the start of the array
    moveToStart(index) {
        if (index >= 0 && index < this.array.length) {
            const [item] = this.array.splice(index, 1); // Remove item
            this.array.unshift(item); // Insert at the start
            this.#saveArrayToLocalStorage();
        }
    }

    // Move item to the end of the array
    moveToEnd(index) {
        if (index >= 0 && index < this.array.length) {
            const [item] = this.array.splice(index, 1); // Remove item
            this.array.push(item); // Insert at the end
            this.#saveArrayToLocalStorage();
        }
    }

    // Get all elements in the array
    getAll() {
        return this.array;
    }

    // Set a new value to a specific index
    set(index, value) {
        if (index >= 0 && index < this.array.length) {
            this.array[index] = value;
            this.#saveArrayToLocalStorage();
        }
    }

    // Clear the array
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


let diagText = "";
let diag = null;
let diag_signals = [];
let signal_texts = [];
let signal_paths = [];
let actor_paths = [];
let actor_boxes = [];
let actor_texts = [];
let seqNum_circles = [];
let seqNum_texts = [];
let clickedSignalIndex = -1;
const filteredActors = new PersistentSet("filteredActors");
const actorOrder = new PersistentArray("actorOrder");
const showIds = new PersistentBool("showIds", false);
const showInstance = new PersistentBool("showInstance", false);
const showRelated = new PersistentBool("showRelated", false);
let diagramContainer = document.getElementById("diagram");


document.getElementById("fileInput").addEventListener("change", function(event) {

    const fileLabel = document.getElementById("fileInputLabel");
    const file = event.target.files[0];
    fileLabel.textContent = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
        diagText = e.target.result;
        clickedSignalIndex = 0;
        loadDiagram(diagText);
    };
    reader.readAsText(file);
});


function loadDiagram(asdf) {
    diag = Diagram.parse(asdf);

    if(haveSameElements(actorOrder.getArray(), diag.actors.map(element => element.name))) {
        const participantOrder = printParticipants(actorOrder.getArray());
        orderedAsdf = participantOrder + "\n\n" + asdf;
        diag = Diagram.parse(orderedAsdf);
    } else {
        actorOrder.clear();
        filteredActors.clear();
        clickedSignalIndex = 0;
    }

    document.getElementById("showIdsToggle").checked = showIds.get();
    document.getElementById("showInstanceToggle").checked = showInstance.get();
    document.getElementById("showRelatedToggle").checked = showRelated.get();

    parseMeta(diag);
    drawDiagram(diag);

    applyShowIds(showIds.get());
    applyShowInstance(showInstance.get());
    applyShowRelated(showRelated.get());
}


function parseMeta(diag)
{
    // parse meta
    diag.signals.forEach((s, i) => {
        s.origIndex = s.index;
        s.origMessage = s.message;
        s.addinfoHead = {};
        if(s.meta) {
            try {
                s.addinfoHead = JSON.parse(s.meta);
            } catch (e) {
                console.error("Invalid JSON in meta:", s.meta);
            }
        }
    });
}

function drawDiagram(diag) {
    diagramContainer.innerHTML = "";

    // remove signals of filtered actors
    for (let i = diag.signals.length - 1; i >= 0; i--) {
        signal = diag.signals[i];
        if((signal.type === 'Signal' && (filteredActors.has(signal.actorA.name) ||
                                         filteredActors.has(signal.actorB.name))) ||
           (signal.type === 'Note' && filteredActors.has(signal.actor.name))) {
            diag.signals.splice(i, 1);
        }
        // mark actor having signal
        else if(signal.type === 'Signal') {
            signal.actorA.hasSignal = true;
            signal.actorB.hasSignal = true;
        }
        else {
            signal.actor.hasSignal = true;
        }
    }

    diag.drawSVG(diagramContainer, { theme: 'simple' });

    diag_signals = diag.signals.filter(item => item.type === 'Signal');
    signal_paths = document.querySelectorAll('path.signal-arrow');
    signal_texts = document.querySelectorAll('text.signal');
    actor_paths = document.querySelectorAll('path.actor-line');
    actor_boxes = document.querySelectorAll('rect.actor-box');
    actor_texts = document.querySelectorAll('text.actor-text');

    // add signal event listeners
    signal_texts.forEach((txt, index) => {
        txt.addEventListener("click", () => signalTextOnClick(index));
        txt.addEventListener("mouseenter", () => showTemporaryAddinfo(index));
        txt.addEventListener("mouseleave", () => showAddinfoContent(clickedSignalIndex));
    });

    function signalTextOnClick(index) {
        if(diag.signals[index].clicked) {
           index = -1;
        }
        applySignalClick(index);
    }


    function applySignalClick(index) {
        if(clickedSignalIndex >= 0 && clickedSignalIndex < diag.signals.length) {
            diag.signals[clickedSignalIndex].clicked = false;
        }
        if(index >= 0) {
            diag.signals[index].clicked = true;
        }
        clickedSignalIndex = index;
        showAddinfoContent(clickedSignalIndex);
        markSignals(clickedSignalIndex);
    }


    // add event listeners to actors
    actorOrder.clear();
    diag.actors.forEach((actor, i) => {
        actorOrder.add(actor.name);
        if(filteredActors.has(actor.name) || actor.hasSignal) {
            actor_texts[2*i].addEventListener("click", () => actorTextOnClick(i));
            actor_texts[2*i+1].addEventListener("click", () => actorTextOnClick(i));
        }
    });


    function actorTextOnClick(index) {
        name = diag.actors[index].name;
        if(filteredActors.has(name))
            filteredActors.delete(name);
        else
            filteredActors.add(name);
        loadDiagram(diagText);
    }


    function showTemporaryAddinfo(index) {
        showAddinfoContent(index);
    }

    function markSignals(refIndex) {
        signal_texts.forEach((text, index) => {

            sig = diag.signals[index];
            refSig = refIndex >= 0 ? diag.signals[refIndex] : { "addinfoHead": { "srcInstanceId": null, "dstInstanceId": null } };
            circle = seqNum_circles[index];
            seqNum = seqNum_texts[index];

            if(sig.addinfoHead.srcInstanceId) {

                sig.isSameSrcInstance = refSig.addinfoHead.srcInstanceId &&
                                        sig.addinfoHead.srcInstanceId === refSig.addinfoHead.srcInstanceId;
                cl = 'same-id-signal';
                if(sig.isSameSrcInstance) {
                    text.classList.add(cl);
                    circle.classList.add(cl);
                    seqNum.classList.add(cl);
                } else {
                    text.classList.remove(cl);
                    circle.classList.remove(cl);
                    seqNum.classList.remove(cl);
                }

                sig.isRelated = refSig.addinfoHead.srcInstanceId &&
                                (sig.addinfoHead.dstInstanceId === refSig.addinfoHead.srcInstanceId ||
                                 sig.addinfoHead.srcInstanceId === refSig.addinfoHead.dstInstanceId);
                cl = 'related-signal';
                if(sig.isRelated) {
                    text.classList.add(cl);
                    circle.classList.add(cl);
                    seqNum.classList.add(cl);
                } else {
                    text.classList.remove(cl);
                    circle.classList.remove(cl);
                    seqNum.classList.remove(cl);
                }
            }

            if(index === refIndex) {
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

    function showAddinfoContent(index) {
        const notation = document.getElementById("notation");
        const meta = document.getElementById("meta");
        const addinfo = document.getElementById("addinfo");
        notation.textContent = "";
        meta.textContent = "";
        addinfo.textContent = "";
        if(index < 0)
            return;
        if(index < diag_signals.length) {
            const s = diag_signals[index];
            notation.textContent = `${index + 1}. ${s.actorA.alias} -> ${s.actorB.alias}: ${s.message}`;
            meta.textContent = s.meta;
            addinfo.textContent = s.addinfo;
        }
    }

    // mark filtered actors for styling
    actor_paths.forEach((a, i) => {
        if(filteredActors.has(diag.actors[i].name) ||
            ! diag.actors[i].hasSignal)
            a.classList.add("filtered-actor");
    });

    markSpecialSignalTexts();
    drawSeqNumCircles();
    markActors();
    applySignalClick(clickedSignalIndex);
    applyShowInstance(showInstance.get());
    applyShowRelated(showRelated.get());
}


function resetBtnOnClick() {
    actorOrder.clear();
    filteredActors.clear();
    showIds.set(false);
    showInstance.set(false);
    showRelated.set(false);
    clickedSignalIndex = 0;
    loadDiagram(diagText);
}


// Make sections resizable
const divider = document.getElementById("divider");
let isResizing = false;

divider.addEventListener("mousedown", (e) => {
    isResizing = true;
    startY = e.clientY; 
    startDiagramHeight = document.getElementById("diagramContainer").offsetHeight;
    document.body.style.userSelect = "none";
    document.body.style.cursor = 'row-resize';
});

// TODO: persist divider position and recall on page load
document.addEventListener("mousemove", (e) => {
    if (isResizing) {
        const deltaY = e.clientY - startY;
        const totalHeight = document.body.offsetHeight;
        const diagramHeight = (startDiagramHeight + deltaY) / totalHeight * 100;
        const infoHeight = 100 - diagramHeight;

        if (diagramHeight > 10 && infoHeight > 10) {
            document.getElementById("diagramContainer").style.height = `${diagramHeight}%`;
            document.getElementById("addinfoDisplay").style.height = `${infoHeight}%`;
        }
    }
});

document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = "";
});


function markSpecialSignalTexts() {
    signal_texts.forEach((text, index) => {
        const signal = diag_signals[index];
        if (signal.addinfoHead) {
            if (signal.addinfoHead.isSpecial || signal.addinfoHead.size <= 0) {
                text.classList.add("special-signal");
            }
        }
    });
}


function markActors() {
    diag.actors.forEach((a, i) => {
        if(filteredActors.has(diag.actors[i].name)) {
            actor_boxes[2*i].classList.add("filtered-actor");
            actor_boxes[2*i+1].classList.add("filtered-actor");
            actor_texts[2*i].classList.add("filtered-actor");
            actor_texts[2*i+1].classList.add("filtered-actor");
        }
        if(! a.hasSignal) {
            actor_boxes[2*i].classList.add("orphan-actor");
            actor_boxes[2*i+1].classList.add("orphan-actor");
            actor_texts[2*i].classList.add("orphan-actor");
            actor_texts[2*i+1].classList.add("orphan-actor");
        }
    });

    addMoveBtns();
}


function drawSeqNumCircles(index) {
    signal_paths.forEach((path, index) => {
        // Get the starting point of the path
        const pathLength = path.getTotalLength();
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
        text.textContent = index + 1;

        // Append them to the SVG element
        path.parentNode.appendChild(circle);
        path.parentNode.appendChild(text);
    });

    seqNum_circles = document.querySelectorAll('circle.seq-num');
    seqNum_texts = document.querySelectorAll('text.seq-num');
}


function showIdsOnChange(isChecked) {
    showIds.set(isChecked);
    applyShowIds(isChecked);
}

function applyShowIds(isChecked) {
    if (isChecked) {
        diag.signals.forEach((signal, index) => {
            if(signal.addinfoHead.srcInstanceId) {
                signal.message += '\n' + signal.addinfoHead.srcInstanceId;
            }
        });
    } else {
        diag.signals.forEach((signal, index) => {
            signal.message = signal.origMessage;
        });
    }
    drawDiagram(diag);
}


function showInstanceOnChange(isChecked) {
    showInstance.set(isChecked);
    applyShowInstance(isChecked);
}

function applyShowInstance(isChecked) {
    cl = 'instance-highlight-off';
    signal_texts.forEach((s, i) => {
        c = seqNum_circles[i];
        if(isChecked) {
            s.classList.remove(cl);
            c.classList.remove(cl);
        } else {
            s.classList.add(cl);
            c.classList.add(cl);
        }
    });
}


function showRelatedOnChange(isChecked) {
    showRelated.set(isChecked);
    applyShowRelated(isChecked);
}

function applyShowRelated(isChecked) {
    cl = 'related-highlight-off';
    signal_texts.forEach((s, i) => {
        c = seqNum_circles[i];
        if(isChecked) {
            s.classList.remove(cl);
            c.classList.remove(cl);
        } else {
            s.classList.add(cl);
            c.classList.add(cl);
        }
    });
}


function addMoveBtns() {
    // Select the rects you want to add chevrons to
    const selectedRects = document.querySelectorAll('.actor-top-box');

    selectedRects.forEach((rect, index) => {
        // Calculate the center of each rect
        const rectX = parseFloat(rect.getAttribute('x'));
        const rectY = parseFloat(rect.getAttribute('y'));
        const rectWidth = parseFloat(rect.getAttribute('width'));
        const rectHeight = parseFloat(rect.getAttribute('height'));

        const rectCenterX = rectX + rectWidth / 2;
        const rectCenterY = rectY + rectHeight / 2;

        // Create the chevron icon
        const moveLeft = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        moveLeft.setAttribute("width", "16");
        moveLeft.setAttribute("height", "16");
        moveLeft.setAttribute("fill", "currentColor");
        moveLeft.setAttribute("class", "move move-left");
        moveLeft.innerHTML = `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>`;
        moveLeft.setAttribute("x", rectX - 8);
        moveLeft.setAttribute("y", rectY + 11);

        moveLeft.addEventListener("click", (event) => {
            chevronOnClick(index, 'left');
        });

        // Create the right chevron (Chevron Right)
        const moveRight = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        moveRight.setAttribute("width", "16");
        moveRight.setAttribute("height", "16");
        moveRight.setAttribute("fill", "currentColor");
        moveRight.setAttribute("class", "move move-right");
        moveRight.innerHTML = `<rect x="0" y="0" width="100%" height="100%" fill="white"/><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>`;
        moveRight.setAttribute("x", rectX + rectWidth - 8);
        moveRight.setAttribute("y", rectY + 11);
        moveRight.addEventListener("click", (event) => {
            chevronOnClick(index, 'right');
        });

        if(index > 0) {
            rect.parentNode.appendChild(moveLeft);
        }
        if(index < diag.actors.length - 1) {
            rect.parentNode.appendChild(moveRight);
        }
    });
}


function chevronOnClick(index, dir) {
    if(dir == 'left') {
        actorOrder.move(index, index - 1);
        console.log(index + " balra");
    } else if (dir == 'right') {
        actorOrder.move(index, index + 1);
        console.log(index + " jobbra");
    }
    console.log(actorOrder);

    loadDiagram(diagText);
}


function printParticipants(array) {
    return array.map(item => `participant ${item}`).join('\n');
}


function haveSameElements(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    if (set1.size !== set2.size) return false;

    for (let elem of set1) {
        if (!set2.has(elem)) return false;
    }

    return true;
}
