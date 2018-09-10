`css-transitioner` is a small footprint React wrapper component that is used to transitioning between different React components. It is designed to work with client side routing to switch between pages.
It all started out when we wanted to add transition to our page routing, instead of switching pages in a flash. However, we couldn't find an easy way to make `react-transition-group` to work with `redux-little-router`.
We had to build a custom component to make it work and ended up with a little library to perform transition using css.

Check out a simple [DEMO](https://alanocoder.github.io/demos/css-transitioner/) in action. [Demo code](https://github.com/alanocoder/demos/tree/master/css-transitioner) is hosted at github.

# Install:
```
npm install --save css-transitioner
```
# Dependencies:
There is no dependencies other than React and React-dom.
# Usage:
```
<Transitioner active={true} transitionStyle='fade-in-out'><YourComponent /></Transitioner>
```
**active**: show the component when set to true, and hide the component when set to false

**transitionStyle**: css class name to be used for the transition. You can have different style for showing and hiding.

**sample css definitions**:
```
.appeared {
    position: relative;
    left: 0;
    width: 100%;
}

.disappeared {
    position: absolute;
    opacity: 0;
}

.fade-in-out {
    position: absolute;
    width: 100%;
    transition: opacity 1.5s ease-out;
}

.fade-in-out.appearing {
    opacity: 1;
}

.fade-in-out.disappearing, .fade-in-out.disappeared {
    opacity: 0;
}
```
There are 4 transition states. Each with a corresponding css class to define the desire transition effect:

**appeared**: when the transition is completed and the component is shown.

**disappeared**: when the transition is completed and the component is hidden.

**appearing**: when the component becomes active and transitions from state '**disappeared**' to '**appeared**'.

**disappearing**: when the component becomes inactive and transitions from state '**appeared**' to '**disappeared**'.

There are several transition examples (zoom in/out, fade in/out, slide in/out) can be found at [Transitions.css](https://alanocoder.github.io/demos/css-transitioner/Transitions.css).
# How it works with multiple route pages:
```
const App = (props: { page: string }) => (
    <div>
        <Transitioner active={props.page === 'HOME'} transitionStyle='fade-in-out'><div>Home page</div></Transitioner>
        <Transitioner active={props.page === 'ABOUT'} transitionStyle='fade-in-out'><div>About page</div></Transitioner>
        <Transitioner active={props.page === 'CONTACT'} transitionStyle='fade-in-out'><div>Contact page</div></Transitioner>
    </div>
);
```
One `Transitioner` per route page (a react component), only 1 is shown (active) at a time. When the property `page` is changed (through link click or route change), the corresponding `Transitioner` will perform the transitions and gracefully switch between different pages.
# Scroll positions:
`Transitioner` remembers scroll positions by default. So yes, it will transition with current scroll position of the page. If you don't want scroll position, add property `ignoreScroll={true}` to `Transitioner`.
# Does it work with TransitionGroup from react-transition-group?
Yes. While `Transitioner` does not make use of `CssTransition`, with `Transitioner_TG` (a simple wrapper provided), it works with `TransitionGroup`:
```
const Pages = {
  HOME: <div>Home page</div>,
  ABOUT: <div>About page</div>,
  CONTACT: <div>Contact page</div>
};

const App = (props: { page: string }) => (
  <TransitionGroup component={null}>
    <Transitioner_TG key={props.page} id={props.page} transitionStyle='fade-in-out'>{Pages[props.page]}</Transitioner_TG>
  </TransitionGroup>
);
```
Note that property `id` is required if scroll positions are maintained.