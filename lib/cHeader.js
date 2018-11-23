"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright 2018 Kodebox, Inc.
// This file is part of CodeChain.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
const codechain_primitives_1 = require("codechain-primitives");
const codechain_primitives_2 = require("codechain-primitives");
const codechain_primitives_3 = require("codechain-primitives");
const utils_1 = require("codechain-sdk/lib/utils");
const RLP = require("rlp");
const BLAKE_NULL_RLP = new codechain_primitives_2.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
class Header {
    constructor(parentHash, timestamp, number, author, extraData, parcelsRoot, stateRoot, invoiceRoot, score, seal, hash, bareHash) {
        this.parentHash = parentHash;
        this.timestamp = timestamp;
        this.number = number;
        this.author = author;
        this.extraData = extraData;
        this.parcelsRoot = parcelsRoot;
        this.stateRoot = stateRoot;
        this.invoiceRoot = invoiceRoot;
        this.score = score;
        this.seal = seal;
        this.hash = hash == undefined ? this.hashing() : hash;
        this.bareHash = bareHash == undefined ? null : bareHash;
    }
    setParentHash(hash) {
        this.parentHash = hash;
    }
    setTimestamp(stamp) {
        this.timestamp = stamp;
    }
    setNumber(number) {
        this.number = number;
    }
    setAuthor(author) {
        this.author = author;
    }
    setExtraData(extraData) {
        this.extraData = extraData;
    }
    setParcelsRoot(root) {
        this.parcelsRoot = root;
    }
    setStateRoot(root) {
        this.stateRoot = root;
    }
    setInvoiceRoot(root) {
        this.invoiceRoot = root;
    }
    setScore(score) {
        this.score = score;
    }
    setSeal(seal) {
        this.seal = seal;
    }
    getHash() {
        return this.hash;
    }
    getBareHash() {
        return this.bareHash;
    }
    getScore() {
        return this.score;
    }
    default() {
        return new Header(new codechain_primitives_2.H256("0000000000000000000000000000000000000000000000000000000000000000"), new codechain_primitives_3.U256(0), new codechain_primitives_3.U256(0), new codechain_primitives_1.H160("0000000000000000000000000000000000000000"), Buffer.alloc(0), BLAKE_NULL_RLP, BLAKE_NULL_RLP, BLAKE_NULL_RLP, new codechain_primitives_3.U256("0000000000000000000000000000000000000000000000000000000000000000"), []);
    }
    toEncodeObject() {
        return [
            this.parentHash.toEncodeObject(),
            this.author.toEncodeObject(),
            this.stateRoot.toEncodeObject(),
            this.parcelsRoot.toEncodeObject(),
            this.invoiceRoot.toEncodeObject(),
            this.score.toEncodeObject(),
            this.number.toEncodeObject(),
            this.timestamp.toEncodeObject(),
            this.extraData
        ].concat(this.seal);
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const decodedmsg = RLP.decode(bytes);
        const parentHash = new codechain_primitives_2.H256(decodedmsg[0].toString("hex"));
        const timestamp = new codechain_primitives_3.U256(parseInt(decodedmsg[7].toString("hex"), 16));
        const number = new codechain_primitives_3.U256(parseInt(decodedmsg[6].toString("hex"), 16));
        const author = new codechain_primitives_1.H160(decodedmsg[1].toString("hex"));
        const extraData = decodedmsg[8];
        const parcelsRoot = new codechain_primitives_2.H256(decodedmsg[3].toString("hex"));
        const stateRoot = new codechain_primitives_2.H256(decodedmsg[2].toString("hex"));
        const invoiceRoot = new codechain_primitives_2.H256(decodedmsg[4].toString("hex"));
        const score = decodedmsg[5];
        const header = new Header(parentHash, timestamp, number, author, extraData, parcelsRoot, stateRoot, invoiceRoot, score, []);
        for (let i = 9; i < decodedmsg.getLength(); i++) {
            header.seal.push(decodedmsg[i]);
        }
        return header;
    }
    hashing() {
        return new codechain_primitives_2.H256(utils_1.blake256(this.rlpBytes()));
    }
}
exports.Header = Header;
