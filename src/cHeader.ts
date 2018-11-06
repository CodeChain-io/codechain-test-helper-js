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
import { H160 } from "codechain-primitives";
import { H256 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
import { blake256 } from "codechain-sdk/lib/utils";

const RLP = require("rlp");
const BLAKE_NULL_RLP: H256 = new H256(
    "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
);

export class Header {
    private parentHash: H256;
    private timestamp: U256;
    private number: U256;
    private author: H160;
    private extraData: Buffer;
    private parcelsRoot: H256;
    private stateRoot: H256;
    private invoiceRoot: H256;
    private score: U256;
    private seal: Array<Buffer>;
    private hash: null | H256;
    private bareHash: null | H256;

    constructor(
        parentHash: H256,
        timestamp: U256,
        number: U256,
        author: H160,
        extraData: Buffer,
        parcelsRoot: H256,
        stateRoot: H256,
        invoiceRoot: H256,
        score: U256,
        seal: Array<Buffer>,
        hash?: H256,
        bareHash?: H256
    ) {
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

    setParentHash(hash: H256) {
        this.parentHash = hash;
    }

    setTimestamp(stamp: U256) {
        this.timestamp = stamp;
    }

    setNumber(number: U256) {
        this.number = number;
    }

    setAuthor(author: H160) {
        this.author = author;
    }

    setExtraData(extraData: Buffer) {
        this.extraData = extraData;
    }

    setParcelsRoot(root: H256) {
        this.parcelsRoot = root;
    }

    setStateRoot(root: H256) {
        this.stateRoot = root;
    }

    setInvoiceRoot(root: H256) {
        this.invoiceRoot = root;
    }

    setScore(score: U256) {
        this.score = score;
    }

    setSeal(seal: Array<Buffer>) {
        this.seal = seal;
    }

    getHash(): H256 | null {
        return this.hash;
    }

    getBareHash(): H256 | null {
        return this.bareHash;
    }

    getScore(): U256 {
        return this.score;
    }

    default(): Header {
        return new Header(
            new H256(
                "0000000000000000000000000000000000000000000000000000000000000000"
            ),
            new U256(0),
            new U256(0),
            new H160("0000000000000000000000000000000000000000"),
            Buffer.alloc(0),
            BLAKE_NULL_RLP,
            BLAKE_NULL_RLP,
            BLAKE_NULL_RLP,
            new U256(
                "0000000000000000000000000000000000000000000000000000000000000000"
            ),
            []
        );
    }

    toEncodeObject(): Array<any> {
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

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): Header {
        const decodedmsg = RLP.decode(bytes);
        const parentHash = new H256(decodedmsg[0].toString("hex"));
        const timestamp = new U256(parseInt(decodedmsg[7].toString("hex"), 16));
        const number = new U256(parseInt(decodedmsg[6].toString("hex"), 16));
        const author = new H160(decodedmsg[1].toString("hex"));
        const extraData = decodedmsg[8];
        const parcelsRoot = new H256(decodedmsg[3].toString("hex"));
        const stateRoot = new H256(decodedmsg[2].toString("hex"));
        const invoiceRoot = new H256(decodedmsg[4].toString("hex"));
        const score = decodedmsg[5];

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
            []
        );

        for (let i = 9; i < decodedmsg.getLength(); i++) {
            header.seal.push(decodedmsg[i]);
        }

        return header;
    }

    hashing(): H256 {
        return new H256(blake256(this.rlpBytes()));
    }
}
