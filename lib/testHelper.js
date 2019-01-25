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
const blockSyncMessage_1 = require("./blockSyncMessage");
const cHeader_1 = require("./cHeader");
const p2pLayer_1 = require("./p2pLayer");
const parcelSyncMessage_1 = require("./parcelSyncMessage");
class TestHelper {
    constructor(ip, port) {
        this.p2psocket = new p2pLayer_1.P2pLayer(ip, port);
        this.log = false;
    }
    setLog() {
        this.log = true;
        this.p2psocket.setLog();
    }
    get genesisHash() {
        return this.p2psocket.getGenesisHash();
    }
    async establish(bestHash, bestScore) {
        await this.p2psocket.connect();
        let isStatusArrived;
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "status") {
                isStatusArrived = true;
            }
        }
        if (!isStatusArrived)
            await this.waitStatusMessage();
        const score = bestScore == undefined ? new codechain_primitives_1.U256("99999999999999999") : bestScore;
        const best = bestHash == undefined
            ? new codechain_primitives_1.H256("0x649fb35c0e304eb601ae71fe330729a2c1a27687ae7e2b0170866b86047a7bb9")
            : bestHash;
        const genesis = this.p2psocket.getGenesisHash();
        this.sendStatus(score, best, genesis);
        await this.waitHeaderRequest();
        if (this.log)
            console.log("Connected\n");
    }
    async end() {
        await this.p2psocket.close();
    }
    // Get block headers from the most recent header response
    getBlockHeaderResponse() {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "response") {
                const responseMsgBody = responseBody.message.getBody();
                if (responseMsgBody.type === "headers") {
                    return responseMsgBody.data;
                }
            }
        }
        return null;
    }
    // Get block bodies from the most recent body response
    getBlockBodyResponse() {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "response") {
                const responseMsgBody = responseBody.message.getBody();
                if (responseMsgBody.type === "bodies") {
                    return responseMsgBody.data;
                }
            }
        }
        return null;
    }
    // Get the most recent parcel sync message from the node
    getParcelSyncMessage() {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "parcels") {
                return requestBody.data;
            }
        }
        return null;
    }
    // Get the most recent block header request from the node
    getBlockHeaderRequest() {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "request") {
                const requestMsgBody = requestBody.message.getBody();
                if (requestMsgBody.type === "headers") {
                    return requestMsgBody;
                }
            }
        }
        return null;
    }
    // Get the most recent block body request from the node
    getBlockBodyRequest() {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "request") {
                const requestMsgBody = requestBody.message.getBody();
                if (requestMsgBody.type === "bodies") {
                    return requestMsgBody;
                }
            }
        }
        return null;
    }
    async sendStatus(score, bestHash, genesisHash) {
        const msg = new blockSyncMessage_1.BlockSyncMessage({
            type: "status",
            totalScore: score,
            bestHash,
            genesisHash
        });
        await this.p2psocket.sendExtensionMessage("block-propagation", new codechain_primitives_1.U256(0), msg.rlpBytes(), false);
    }
    async sendHeaderRequest(startNumber, maxCount) {
        const msg = new blockSyncMessage_1.BlockSyncMessage({
            type: "request",
            id: new codechain_primitives_1.U256(1),
            message: new blockSyncMessage_1.RequestMessage({
                type: "headers",
                startNumber,
                maxCount,
            }),
        });
        await this.p2psocket.sendExtensionMessage("block-propagation", new codechain_primitives_1.U256(0), msg.rlpBytes(), false);
    }
    async sendBlockHeaderResponse(headers) {
        const message = new blockSyncMessage_1.ResponseMessage({ type: "headers", data: headers });
        const msg = new blockSyncMessage_1.BlockSyncMessage({
            type: "response",
            id: this.p2psocket.getHeaderNonce(),
            message
        });
        await this.p2psocket.sendExtensionMessage("block-propagation", new codechain_primitives_1.U256(0), msg.rlpBytes(), false);
    }
    async sendBlockBodyResponse(bodies) {
        const message = new blockSyncMessage_1.ResponseMessage({ type: "bodies", data: bodies });
        const msg = new blockSyncMessage_1.BlockSyncMessage({
            type: "response",
            id: this.p2psocket.getBodyNonce(),
            message
        });
        await this.p2psocket.sendExtensionMessage("block-propagation", new codechain_primitives_1.U256(0), msg.rlpBytes(), false);
    }
    async sendParcelSyncMessage(parcels) {
        const message = new parcelSyncMessage_1.ParcelSyncMessage({
            type: "parcels",
            data: parcels
        });
        await this.p2psocket.sendExtensionMessage("parcel-propagation", new codechain_primitives_1.U256(0), message.rlpBytes(), false);
    }
    async sendEncodedBlock(header, body, bestBlockHash, bestBlockScore) {
        if (this.log)
            console.log("Send blocks");
        const score = bestBlockScore;
        const best = bestBlockHash;
        const genesis = this.p2psocket.getGenesisHash();
        await this.sendStatus(score, best, genesis);
        await this.sendBlockHeaderResponse(header);
        if (this.log)
            console.log("Send header response");
        await this.waitBodyRequest();
        await this.sendBlockBodyResponse(body);
        if (this.log)
            console.log("Send body response");
    }
    async sendBlock(header, body) {
        if (this.log)
            console.log("Send blocks");
        const bestBlock = header[header.length - 1];
        const score = bestBlock.getScore();
        const best = bestBlock.hashing();
        const genesis = this.p2psocket.getGenesisHash();
        await this.sendStatus(score, best, genesis);
        await this.sendBlockHeaderResponse(header.map(header => header.toEncodeObject()));
        if (this.log)
            console.log("Send header response");
        await this.waitBodyRequest();
        await this.sendBlockBodyResponse(body.map(parcels => parcels.map(parcel => parcel.toEncodeObject())));
        if (this.log)
            console.log("Send body response");
    }
    async sendEncodedParcel(parcels) {
        if (this.log)
            console.log("Send parcels");
        await this.sendParcelSyncMessage(parcels);
    }
    async sendParcel(parcels) {
        if (this.log)
            console.log("Send parcels");
        await this.sendParcelSyncMessage(parcels.map(parcel => parcel.toEncodeObject()));
    }
    async waitForBlockSyncMessage(type) {
        return new Promise((resolve, reject) => {
            switch (type) {
                case blockSyncMessage_1.MessageType.MESSAGE_ID_STATUS: {
                    blockSyncMessage_1.Emitter.once("status", () => {
                        resolve();
                    });
                    break;
                }
                case blockSyncMessage_1.MessageType.MESSAGE_ID_GET_HEADERS: {
                    blockSyncMessage_1.Emitter.once("headerrequest", () => {
                        resolve();
                    });
                    break;
                }
                case blockSyncMessage_1.MessageType.MESSAGE_ID_GET_BODIES: {
                    blockSyncMessage_1.Emitter.once("bodyrequest", () => {
                        resolve();
                    });
                    break;
                }
                case blockSyncMessage_1.MessageType.MESSAGE_ID_HEADERS: {
                    blockSyncMessage_1.Emitter.once("headerresponse", () => {
                        resolve();
                    });
                    break;
                }
                case blockSyncMessage_1.MessageType.MESSAGE_ID_BODIES: {
                    blockSyncMessage_1.Emitter.once("headerresponse", () => {
                        resolve();
                    });
                    break;
                }
                default: {
                    console.error("Not implemented");
                    reject();
                }
            }
        });
    }
    async waitStatusMessage() {
        try {
            await this.waitForBlockSyncMessage(blockSyncMessage_1.MessageType.MESSAGE_ID_STATUS);
        }
        catch (error) {
            console.error(error);
        }
    }
    async waitHeaderRequest() {
        try {
            await this.waitForBlockSyncMessage(blockSyncMessage_1.MessageType.MESSAGE_ID_GET_HEADERS);
        }
        catch (error) {
            console.error(error);
        }
    }
    async waitBodyRequest() {
        try {
            await this.waitForBlockSyncMessage(blockSyncMessage_1.MessageType.MESSAGE_ID_GET_BODIES);
        }
        catch (error) {
            console.error(error);
        }
    }
    async waitHeaderResponse() {
        try {
            await this.waitForBlockSyncMessage(blockSyncMessage_1.MessageType.MESSAGE_ID_HEADERS);
        }
        catch (error) {
            console.error(error);
        }
    }
    async waitBodyResponse() {
        try {
            await this.waitForBlockSyncMessage(blockSyncMessage_1.MessageType.MESSAGE_ID_BODIES);
        }
        catch (error) {
            console.error(error);
        }
    }
    soloGenesisBlockHeader() {
        const parentHash = new codechain_primitives_1.H256("0000000000000000000000000000000000000000000000000000000000000000");
        const timestamp = new codechain_primitives_1.U256(0);
        const number = new codechain_primitives_1.U256(0);
        const author = new codechain_primitives_1.H160("0000000000000000000000000000000000000000");
        const extraData = Buffer.from([
            23,
            108,
            91,
            111,
            253,
            100,
            40,
            143,
            87,
            206,
            189,
            160,
            126,
            135,
            186,
            91,
            4,
            70,
            5,
            195,
            246,
            153,
            51,
            67,
            233,
            113,
            143,
            161,
            0,
            209,
            115,
            124
        ]);
        const parcelsRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const stateRoot = new codechain_primitives_1.H256("09f943122bfbb85adda8209ba72514374f71826fd874e08855b64bc95498cb02");
        const invoicesRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const score = new codechain_primitives_1.U256(131072);
        const seal = [];
        const header = new cHeader_1.Header(parentHash, timestamp, number, author, extraData, parcelsRoot, stateRoot, invoicesRoot, score, seal);
        return header;
    }
    soloBlock1(parent) {
        const parentHash = parent;
        const timestamp = new codechain_primitives_1.U256(1537509963);
        const number = new codechain_primitives_1.U256(1);
        const author = new codechain_primitives_1.H160("7777777777777777777777777777777777777777");
        const extraData = Buffer.alloc(0);
        const parcelsRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const stateRoot = new codechain_primitives_1.H256("09f943122bfbb85adda8209ba72514374f71826fd874e08855b64bc95498cb02");
        const invoicesRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const score = new codechain_primitives_1.U256(999999999999999);
        const seal = [];
        const header = new cHeader_1.Header(parentHash, timestamp, number, author, extraData, parcelsRoot, stateRoot, invoicesRoot, score, seal);
        return header;
    }
    soloBlock2(parent) {
        const parentHash = parent;
        const timestamp = new codechain_primitives_1.U256(1537944287);
        const number = new codechain_primitives_1.U256(2);
        const author = new codechain_primitives_1.H160("6666666666666666666666666666666666666666");
        const extraData = Buffer.alloc(0);
        const parcelsRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const stateRoot = new codechain_primitives_1.H256("09f943122bfbb85adda8209ba72514374f71826fd874e08855b64bc95498cb02");
        const invoicesRoot = new codechain_primitives_1.H256("45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0");
        const score = new codechain_primitives_1.U256(999999999999999);
        const seal = [];
        const header = new cHeader_1.Header(parentHash, timestamp, number, author, extraData, parcelsRoot, stateRoot, invoicesRoot, score, seal);
        return header;
    }
}
exports.TestHelper = TestHelper;
