/// <reference types="node" />
import { H160 } from "codechain-primitives";
import { H256 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
export declare class Header {
    private parentHash;
    private timestamp;
    private number;
    private author;
    private extraData;
    private parcelsRoot;
    private stateRoot;
    private invoiceRoot;
    private score;
    private seal;
    private hash;
    private bareHash;
    constructor(parentHash: H256, timestamp: U256, number: U256, author: H160, extraData: Buffer, parcelsRoot: H256, stateRoot: H256, invoiceRoot: H256, score: U256, seal: Array<Buffer>, hash?: H256, bareHash?: H256);
    setParentHash(hash: H256): void;
    setTimestamp(stamp: U256): void;
    setNumber(number: U256): void;
    setAuthor(author: H160): void;
    setExtraData(extraData: Buffer): void;
    setParcelsRoot(root: H256): void;
    setStateRoot(root: H256): void;
    setInvoiceRoot(root: H256): void;
    setScore(score: U256): void;
    setSeal(seal: Array<Buffer>): void;
    getHash(): H256 | null;
    getBareHash(): H256 | null;
    getScore(): U256;
    default(): Header;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): Header;
    hashing(): H256;
}
