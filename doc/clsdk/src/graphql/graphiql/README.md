# GraphQL: GraphiQL UI

cleos isn't very handy for running GraphQL queries. This webapp, based on GraphiQL, provides a friendlier alternative.

The files:

* [app.html](app.html)
* [index.tsx](index.tsx)
* [package.json](package.json)
* [tsconfig.json](tsconfig.json)
* [webpack.config.js](webpack.config.js)
* [yarn.lock](yarn.lock)

## Building and Running

* Follow the instructions in [GraphQL: Getting Started](../starting/index.html#starting-the-example) to start nodeos
* Run `yarn && yarn build && yarn start`
* Open [http://localhost:3000/](http://localhost:3000/)

## index.tsx

`index.tsx`:
```cpp
{{#include index.tsx}}
```
