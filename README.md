# somatic.js
Functional, Asynchronous, Component-based UI Library that works with JSX

## Install
npm install --save @sparkwave/somatic

## Features
### Function-based
All components in Somatic are regular (stateless) or generator (stateful) synchronous or asynchronous functions, . No classes, hooks, proxies or template languages are needed. These feature allows for simple and direct state management right inside components. 

### Declarative
Somatic supports the JSX syntax popularized by React, allowing you to write HTML-like code directly in JavaScript.

### Props/State interaction management
Somatic allows component authors to manage the interaction between state and props directly in components, without any ugly life-cycle methods as in React, by injecting any props updates in the generators returned from stateful components.

### Strong JSX typing 
Somatic supports very strong JSX typing. Elements and children are well typed, and components can specify if they accept children, something not possible in react

### Key system
Every component is uniquely identified internally by a key. This key is comprised of the component xpath ("Layout-(3)div-(0)-span"), and the component's name. If a component is stateful (generator-based), changing its key (by updating its "key" attribute) will trigger a full re-initialization instead of an additional yield. That allows the refreshing of data defined outside of the "while" loop.