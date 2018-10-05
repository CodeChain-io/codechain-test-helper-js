# codechain-test-helper-js
CodeChain test helper is a library for unit test of the CodeChain core. Written in TypeScript, it is designed to send a sequece of p2p messages to the CodeChain node efficiently and conveniently as if it were a node

## Build
Download codechain-test-helper
```shell
git clone https://github.com/CodeChain-io/codechain-test-helper-js.git
cd codechain-test-helper-js
```
Build
```shell
yarn build
cd lib
```
you can use test-helper class in `testHelper.js`

## How to use in your JS project
Add this line to your `package.json` in your project directory
```
"dependencies": {
...
"codechain-test-helper": "https://github.com/CodeChain-io/codechain-test-helper-js.git#a4a9c26635a52395dfd17733eef66b18a144fd00"
...
}
```
than you can use test-helper in your project by adding this line infront of your code
```javascript
import { TestHelper } from "codechain-test-helper/lib/testHelper";
```

## Formatting
```shell
yarn fmt
```
