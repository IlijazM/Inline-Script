# Inline-script.js
 
Inline-script.js is an easy to use, front-end framework that aims to improve your workflow by grouping code and html together.

## Installation

Add this to your head

```html
<script src="inline-script.js"></script>
```

At the end of your body you need to execute:

```html
<script>
    inlineScript();
</script>
```

## Getting started

- [Basic inline script syntax](#Basic-inline-script-syntax)
- [Updating an element](#Updating-an-element)
- [Button syntax](#Button-syntax)
- [Nesting HTML elements](#Nesting-HTML-elements)
- [Scope](#Scope)
- [Manipulating attributes](#Manipulating-attributes)
- [Loading files](#Loading-files)
- [Scoped css](#Scoped-css)
- [Macros](#Macros)

### Basic inline script syntax

Inline-script.js provides new syntax to your html. Let's say you want to randomize the content of a ``div``. The typically way to approach this is by adding an empty ``div`` that will later be filled with content and whenever a button got pressed, a function will get called.

```html
<body>
    <div id="random"></div>

    <button onclick="pressed()">CLICK ME</button>

    <script>
        function setContent() {
            document.querySelector('#random').innerHTML = ['🧁', '🍫', '🍬', '🍭', '🍡'][Math.floor(Math.random() * 5)];
        }

        function pressed() {
            setContent();
        }

        setContent();
    </script>
</body>
```

As you can see, the actual code that describes the functionality of the ``div`` can sometimes be very far away. Inline-script.js has a solution for this. If you start the content of the ``div`` with a ``{`` (or ``{{`` for syntax highlighting) you use the inline script syntax. This script will automatically get executed and the resulting value will be the content of the ``div``

```html
<body>
    <div id="random">{{
        ['🧁', '🍫', '🍬', '🍭', '🍡'][Math.floor(Math.random() * 5)];
    }}</div>
</body>
```

Using this syntax your html element are visually connected with the appropriate code which improves the structure of your html.

### Updating an element

To update the ``div`` your can select it with a query and then simply call ``render()``

```javascript
document.querySelector('#random').render();
```

### Button syntax

There is an extra syntax for the ``button`` element as well. If you use the inline script syntax on a ``button``, the inline script will get executed whenever the client clicks on the ``button``. To set the text on the ``button`` you can use the attribute ``value``.

```html
<button value="CLICK ME">{{
    document.querySelector('#random').render();
}}</button>
```

### Nesting HTML elements

Let's look at another example where we want to display a list. Let's first define a list:

```html
<script>
    const list = [ '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘' ];
</script>
```

now let's display this list in an unsorted list using the inline script syntax:

```html
<ul>{{
    navigation.map(item => {
        return item;
    });
}}</ul>
```

but let's say that we want every item in a separate ``div`` element. We could write

```javascript
return '<div>' + div + '</div>';
```

but this isn't very practical. Fortunately, Inline-script.js provides a new syntax for nesting html elements in the new inline script syntax. You can use this syntax by putting your html element inside parentheses.

```html
<ul>{{
    navigation.map(item => {
        return (<div>{ item }</div>);
    });
}}</ul>
```

You can repeat this process indefinitely. Also, previous defined variables will be accessible in the same scope:

```html
<div>{{
    let random = Math.random() * 100;

    (<h1>{ random + Math.random(); }</h1>)
}}</div>
```

### Reacting to variable changes

Inline-script.js provides the attribute ``reacts-to`` that re-renders the current element whenever a global or scoped variable changed. This, however, only works with strings, numbers and booleans.

```html
<div>{{
    let counter = 0;

    (<div>
        <h1 reacts-to="counter">{ 'counter = ' + counter; }</h1>
        <button value="increment">{ counter++; }</button>
    </div>)
}}</div>
```

To react to a change in an array you can alternatively use ``array.length`` if you want to react to the change of the size of an array.

### Scope

Whenever you're nesting an element in the inline script syntax you may use the variable ``scope`` to get the outer element (in this example the element with the id ``outer``). This can be used to make sure that you select an element that is inside the outer element.

```html
<div id="outer">{{
    let counter = 0;

    (<div>
        <h1 id="display">{ 'counter = ' + counter; }</h1>
        <button value="increment">{
            counter++;
            scope.querySelector('#display').render();
        }</button>
    </div>)
}}</div>
```

### Manipulating attributes

You can also use the inline script syntax in attributes. To do this you simply nest your inline script syntax into two curly brackets ``{{ ... }}``.

```html
<div class="color{{ Math.floor(Math.random() * 3) }}">
    Random color
</div>

<style>
    .color0 { color: red; }
    .color1 { color: blue; }
    .color2 { color: green; }
</style>
```

Now whenever the ``render`` function is getting called, the attributes will get updates as well. But keep in mind that syntaxes like

```html
<p class={{item == currentItem ? 'active' : ''}}>{{ item }}</p>
```

will not work simply because this could get converted to junk:

```html
<p class="{{item inline-script-uid-0 has-inline-script" =="currentItem" ?="" 'active'="" :="" ''}}="">{{ item }}</p>
```

### Loading files

Inline-script.js provides a function called ``load`` which loads another file. It takes three parameters. First the ``element`` which usually is ``this``, then the ``url`` (e.g. ``'header.html'``) and then optionally some arguments in form of an object.

```html
<!-- index.html -->
<div>{{
    load(this, 'header.html', { title: 'My website' })
}}</div>

<!-- header.html -->
<div>
    <header>
        <div class="title">{{title}}</div>
        <nav> ... </nav>
    </header>
</div>
```

Note that you can only use one element in a new file so this is not a valid syntax:

```html
<h1>Hello</h1>
<h2>world</h2>
```

but this is:

```html
<div>
    <h1>Hello</h1>
    <h2>world</h2>
</div>
```

There is also another way to load a file and to use the ``innerHTML`` of an element as an argument. You can use the attribute ``load`` to load another file. Additional arguments can be set by using attributes as well. The ``innerHTML`` of the original element will then be stored inside the variable ``html``

```html
<!-- index.html -->
<div load="big.html" color="red">
    Hello, world!
</div>

<!-- big.html -->
<div style="font-size: 6em; color: {{color}}">{{
    html
}}</div>
```

You can also combine this with the inline script syntax, so this is a valid syntax as well:

```html
<div load="big.html" color="red">{{
    Math.random() * 100;
}}</div>
```

### Scoped css

Inline-script.js also comes with scoped css. This works exactly the same as in [scoped-css-js](https://github.com/IlijazM/scoped-css-js). To scope your css you can use the attribute ``scoped`` like this:

```html
<div>
    <h1>Hello, world</h1>
    <style scoped>
        h1 {
            font-weight: 800;
            font-size: 6em;
        }
    </style>
</div>
```

This will automatically scope the css to the outer div. To access the outer element you can use the selector ``#this``:

```html
<div>
    <p>Hello, world!</p>
    <style scoped>
        #this {
            background: black;
            color: white;
        }
    </style>
</div>
```

### Macros

Macros are a great way to design custom elements. You simply define a macro by using the tag ``define``. The following attribute will set the tag of the macro and the innerHTML will set the replacement value. For example we can define the tag ``six-times`` like this

```html
<define six-times>
    <h1>Hello, world</h1>
    <h2>Hello, world</h2>
    <h3>Hello, world</h3>
    <h4>Hello, world</h4>
    <h5>Hello, world</h5>
    <h6>Hello, world</h6>
</define>
```

and now whenever we're using the tag ``six-times``

```html
<six-times></six-times>
```

it will get replaced with:

```html
<div>
    <h1>Hello, world</h1>
    <h2>Hello, world</h2>
    <h3>Hello, world</h3>
    <h4>Hello, world</h4>
    <h5>Hello, world</h5>
    <h6>Hello, world</h6>
</div>
```

You can use arguments in the same way as the attribute ``load``:

```html
<define margin>
    <p style="margin: {{margin}}px;">{ html }</p>
</define>

<margin margin=20>
    <p>Hello</p>
</margin>
```