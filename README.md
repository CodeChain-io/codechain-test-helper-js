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

## Example
### Send Blocks
```typescript
async function sendBlock() {
    // The argument of TestHelper class is an ip and port of the target CodeChain node.
    // If the CodeChain node is running on your local machine, use IP as "0.0.0.0". 
    const TH = new TestHelper("0.0.0.0", 3485);
    
    // If you set log mode, all the log below the session message will be printed.
    // The defualt is off.
    TH.setLog();
    
    // Establish connection with the target node.
    // If establishment is completed, you can send sync messages.
    await TH.establish();
    
    // Hardcoded Genesis block
    const header = TH.soloGenesisBlockHeader();

    // The hardcoded block get the parent hash as an argument.
    // Hardcoded Block 1
    const header1 = TH.soloBlock1(header.hashing());

    // Hardcoded Block 2
    const header2 = TH.soloBlock2(header1.hashing());

    // First argument is block headers. You have to send a valid sequence of headers. If you do not, this function will not end.
    // Second argument is for block body. you have to send a valid sequence of parcels of each block. If you do not, the blocks are not accepted
    // Third argument is a besthash and Fourth argument is best block's score.
    await TH.sendBlock(
        [
            header,
            header1,
            header2
        ],
        [[], []],
        header2.hashing(),
        header2.getScore()
    );

    // Send FIN packet to the target node
    await TH.end();
}
sendBlock();
```
### Send Parcels
```typescript
async function sendParcel() {
    const TH = new TestHelper("0.0.0.0", 3485);
    TH.setLog();
    await TH.establish();

    const sdk = new SDK({
        server: process.env.CODECHAIN_RPC_HTTP || "http://localhost:8080",
        networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
    });
    const ACCOUNT_SECRET =
        process.env.ACCOUNT_SECRET ||
        "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
    const parcel = sdk.core.createPaymentParcel({
        recipient: "tccqruq09sfgax77nj4gukjcuq69uzeyv0jcs7vzngg",
        amount: 10000
    });
    const signedparcel = parcel.sign({
        secret: ACCOUNT_SECRET,
        fee: 10,
        nonce: 0
    });

    // You can send a sequence of any kinds of parcels defined in CodeChain-sdk.
    await TH.sendParcel([signedparcel]);

    await TH.end();
}
sendParcel();
```
### Header
You can make an arbitrary block header by your own.
```typescript
// You should import the Header class in your project
import { Header } from "codechain-test-helper/lib/cHeader";
    const header = new Header(
        parentHash,
        timestamp,
        number,
        author,
        extraData,
        parcelsRoot,
        stateRoot,
        invoiceRoot,
        score,
        seal
    );
    ```
