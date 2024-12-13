# ASDF-V

ASDF-V is an interactive vector graphics tool for visualizing
sequence diagrams in the Augmented Sequence Diagram Format (ASDF).


## Input example

```
"Alice"->"Bob": Hey Bob, how you doin'?
	~~~ { "timestamp": "2024-11-16T09:30:16.215", "srcInstanceId": "fPZKzpC", "dstInstanceId": "c9c73c34", "size": 32, "isSpecial": true }
Hello Bob, I was wondering if
you would fancy saying hi to me
	~~~

note over "Bob": Hmm, wierd
	~~~ { "timestamp": "2024-11-16T09:30:17.689", "srcInstanceId": "c9c73c34", "size": 0 }
	~~~

"Bob"-->>"Alice": Oh, hi
	~~~ { "timestamp": "2024-11-16T13:43:21.361", "srcInstanceId": "c9c73c34", "dstInstanceId": "fPZKzpC", "size": 6 }
Oh, hi
	~~~
```

## Rendered diagram example

![ASDF example](img/asdf-example.png)


## ASDF Syntax

### document:

![ASDF syntax](img/asdf-rr.svg)

### add-info:

![ASDF addinfo syntax](img/asdf-add-info-rr.svg)

## Usage

Open `index.html`, choose a file of the syntax shown above
and explore the visualization.


## Dependencies

### `js/sequence-diagrams.js`

taken from https://github.com/xsnpdngv/seqdiag-js which is a
modification of https://github.com/bramp/js-sequence-diagrams to handle
the extra syntax for additional information between tilde-triplets
(`~~~`).


### `js/raphael.js`

https://github.com/DmitryBaranovskiy/raphael


### `js/underscore.js`

https://github.com/jashkenas/underscore
