# Trace Visualizer

Displays trace logs of a specialized sequence diagram syntax as SVG. The
signals/messages on the shown diagram are clickable. On click the additional
information that belongs to the signal is displayed under the diagram.

## Input example

```
title: Diagram title
Alice->Bob: Short message description
~~~
Additional information that belongs
to the signal above. It is shown if
the signal text is clicked on the
rendered SVG.
~~~
Bob-->>Alice: Response
~~~
Bob is not talkative person on the
surface but might have something to say
to Alice
~~~ 
```

## Rendered diagram example

![Traceviz example](img/traceviz-example.png)


## Usage

Open `traceviz.html`, choose a file of the syntax shown above
and explore the visualization.


## Dependencies

### `js/sequence-diagrams-min.js`

and `js/sequence-diagram.js` (for debugging) are
taken from https://github.com/xsnpdngv/seqdiag-js which is a
modification of https://github.com/bramp/js-sequence-diagrams to handle
the extra syntax for additional information between tilde-triplets
(`~~~`).


### `js/raphael.min.js`

and `js/raphael.js` (for debugging) are taken from
https://github.com/DmitryBaranovskiy/raphael


### `js/underscore/min.js`

and `js/underscore.js` (for debugging) are taken from
https://github.com/jashkenas/underscore

