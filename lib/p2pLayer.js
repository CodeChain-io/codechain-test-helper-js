"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const session_1 = require("./session");
const p2pMessage_1 = require("./p2pMessage");
const sessionMessage_1 = require("./sessionMessage");
const blockSyncMessage_1 = require("./blockSyncMessage");
const parcelSyncMessage_1 = require("./parcelSyncMessage");
const codechain_primitives_1 = require("codechain-primitives");
const codechain_primitives_2 = require("codechain-primitives");
const NET = require("net");
class P2pLayer {
    constructor(ip, port) {
        this.session = new session_1.Session(ip, port);
        this.socket = new NET.Socket();
        this.ip = ip;
        this.port = port;
        this.allowedFinish = false;
        this.arrivedExtensionMessage = [];
        this.tcpBuffer = Buffer.alloc(0);
        this.genesisHash = new codechain_primitives_1.H256("0000000000000000000000000000000000000000000000000000000000000000");
        this.recentHeaderNonce = new codechain_primitives_2.U256(0);
        this.recentBodyNonce = new codechain_primitives_2.U256(0);
        this.log = false;
    }
    setLog() {
        this.log = true;
        this.session.setLog();
    }
    getGenesisHash() {
        return this.genesisHash;
    }
    getArrivedExtensionMessage() {
        return this.arrivedExtensionMessage;
    }
    getHeaderNonce() {
        return this.recentHeaderNonce;
    }
    getBodyNonce() {
        return this.recentBodyNonce;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.session.connect();
                }
                catch (err) {
                    console.error(err);
                    reject(err);
                }
                this.socket.connect({ port: this.port, host: this.ip }, () => {
                    if (this.log)
                        console.log("Start TCP connection");
                    if (this.log)
                        console.log("   local = %s:%s", this.socket.localAddress, this.socket.localPort);
                    if (this.log)
                        console.log("   remote = %s:%s", this.socket.remoteAddress, this.socket.remotePort);
                    this.sendP2pMessage(p2pMessage_1.MessageType.SYNC_ID);
                    this.socket.on("data", (data) => {
                        try {
                            this.tcpBuffer = Buffer.concat([
                                this.tcpBuffer,
                                data
                            ]);
                            while (this.tcpBuffer.length !== 0) {
                                const len = this.tcpBuffer.readUIntBE(0, 1);
                                if (len >= 0xf8) {
                                    const lenOfLen = len - 0xf7;
                                    const dataLen = this.tcpBuffer
                                        .slice(1, 1 + lenOfLen)
                                        .readUIntBE(0, lenOfLen);
                                    if (this.tcpBuffer.length >=
                                        dataLen + lenOfLen + 1) {
                                        const rlpPacket = this.tcpBuffer.slice(0, dataLen + lenOfLen + 1);
                                        this.tcpBuffer = this.tcpBuffer.slice(dataLen + lenOfLen + 1, this.tcpBuffer.length);
                                        if (this.onP2pMessage(rlpPacket) ===
                                            true)
                                            resolve();
                                    }
                                    else {
                                        throw Error("The rlp data has not arrived yet");
                                    }
                                }
                                else if (len >= 0xc0) {
                                    const dataLen = len - 0xc0;
                                    if (this.tcpBuffer.length >= dataLen + 1) {
                                        const rlpPacket = this.tcpBuffer.slice(0, dataLen + 1);
                                        this.tcpBuffer = this.tcpBuffer.slice(dataLen + 1, this.tcpBuffer.length);
                                        if (this.onP2pMessage(rlpPacket) ===
                                            true)
                                            resolve();
                                    }
                                    else {
                                        throw Error("The rlp data has not arrived yet");
                                    }
                                }
                                else {
                                    throw Error("Invalid RLP data");
                                }
                            }
                        }
                        catch (err) {
                            console.error(err);
                        }
                    });
                    this.socket.on("end", () => {
                        if (this.log)
                            console.log("TCP disconnected");
                    });
                    this.socket.on("error", (err) => {
                        if (this.log)
                            console.log("Socket Error: ", JSON.stringify(err));
                    });
                    this.socket.on("close", () => {
                        if (this.log)
                            console.log("Socket Closed");
                    });
                });
            }));
        });
    }
    sendP2pMessage(messageType) {
        switch (messageType) {
            case p2pMessage_1.MessageType.SYNC_ID: {
                if (this.log)
                    console.log("Send SYNC_ID Message");
                const nodeId = new sessionMessage_1.NodeId(this.socket.localAddress, this.session.getPort());
                const msg = new p2pMessage_1.HandshakeMessage({
                    type: "sync",
                    version: new codechain_primitives_2.U256(0),
                    port: this.session.getPort(),
                    nodeId
                });
                const signedMsg = new p2pMessage_1.SignedMessage(msg, this.session.getTargetNonce());
                this.writeData(signedMsg.rlpBytes());
                break;
            }
            case p2pMessage_1.MessageType.REQUEST_ID: {
                if (this.log)
                    console.log("Send REQUEST_ID Message");
                const extensionName = [
                    "block-propagation",
                    "parcel-propagation"
                ];
                let msg = new p2pMessage_1.NegotiationMessage(new codechain_primitives_2.U256(0), new codechain_primitives_2.U256(0), {
                    type: "request",
                    extensionName: extensionName[0],
                    extensionVersion: [new codechain_primitives_2.U256(0)]
                });
                let signedMsg = new p2pMessage_1.SignedMessage(msg, this.session.getTargetNonce());
                this.writeData(signedMsg.rlpBytes());
                msg = new p2pMessage_1.NegotiationMessage(new codechain_primitives_2.U256(0), new codechain_primitives_2.U256(1), {
                    type: "request",
                    extensionName: extensionName[1],
                    extensionVersion: [new codechain_primitives_2.U256(0)]
                });
                signedMsg = new p2pMessage_1.SignedMessage(msg, this.session.getTargetNonce());
                this.writeData(signedMsg.rlpBytes());
                break;
            }
            default:
                throw Error("Unimplemented");
        }
    }
    sendExtensionMessage(extensionName, extensionVersion, data, needEncryption) {
        return __awaiter(this, void 0, void 0, function* () {
            const secret = this.session.getSecret();
            if (secret == null)
                throw Error("Secret is not specified");
            let msg;
            if (needEncryption) {
                msg = new p2pMessage_1.ExtensionMessage(new codechain_primitives_2.U256(0), extensionName, extensionVersion, { type: "encrypted", data }, secret, this.session.getTargetNonce());
            }
            else {
                msg = new p2pMessage_1.ExtensionMessage(new codechain_primitives_2.U256(0), extensionName, extensionVersion, { type: "unencrypted", data }, secret, this.session.getTargetNonce());
            }
            const signedMsg = new p2pMessage_1.SignedMessage(msg, this.session.getTargetNonce());
            yield this.writeData(signedMsg.rlpBytes());
        });
    }
    writeData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield !this.socket.write(data);
            if (!success) {
                ((data) => __awaiter(this, void 0, void 0, function* () {
                    yield this.socket.once("drain", () => {
                        this.writeData(data);
                    });
                }))(data);
            }
        });
    }
    onP2pMessage(data) {
        const secret = this.session.getSecret();
        const nonce = this.session.getNonce();
        if (secret == null)
            throw Error("Secret is not specified");
        if (nonce == null)
            throw Error("Nonce is not specified");
        try {
            const msg = p2pMessage_1.SignedMessage.fromBytes(data, secret, nonce);
            switch (msg.protocolId()) {
                case p2pMessage_1.MessageType.SYNC_ID: {
                    if (this.log)
                        console.log("Got SYNC_ID message");
                    break;
                }
                case p2pMessage_1.MessageType.ACK_ID: {
                    if (this.log)
                        console.log("Got ACK_ID message");
                    this.sendP2pMessage(p2pMessage_1.MessageType.REQUEST_ID);
                    break;
                }
                case p2pMessage_1.MessageType.REQUEST_ID: {
                    if (this.log)
                        console.log("Got REQUEST_ID message");
                    break;
                }
                case p2pMessage_1.MessageType.ALLOWED_ID: {
                    if (this.log)
                        console.log("Got ALLOWED_ID message");
                    if (this.allowedFinish)
                        return true;
                    this.allowedFinish = true;
                    break;
                }
                case p2pMessage_1.MessageType.DENIED_ID: {
                    if (this.log)
                        console.log("Got DENIED_ID message");
                    break;
                }
                case p2pMessage_1.MessageType.ENCRYPTED_ID: {
                    if (this.log)
                        console.log("Got ENCRYPTED_ID message");
                    this.onExtensionMessage(msg);
                    break;
                }
                case p2pMessage_1.MessageType.UNENCRYPTED_ID: {
                    if (this.log)
                        console.log("Got UNENCRYPTED_ID message");
                    this.onExtensionMessage(msg);
                    break;
                }
                default:
                    throw Error("Unreachable");
            }
        }
        catch (err) {
            console.error(err);
        }
        return false;
    }
    onExtensionMessage(msg) {
        switch (msg.getName()) {
            case "block-propagation": {
                const extensionMsg = blockSyncMessage_1.BlockSyncMessage.fromBytes(msg.getData().data);
                this.arrivedExtensionMessage.push(extensionMsg);
                const body = extensionMsg.getBody();
                if (body.type === "status") {
                    this.genesisHash = body.genesisHash;
                }
                else if (body.type === "request") {
                    const msg = body.message.getBody();
                    if (msg.type === "headers")
                        this.recentHeaderNonce = body.id;
                    else if (msg.type === "bodies") {
                        this.recentBodyNonce = body.id;
                        if (this.log)
                            console.log(msg.data);
                    }
                }
                if (this.log)
                    console.log(extensionMsg);
                if (this.log)
                    console.log(extensionMsg.getBody());
                break;
            }
            case "parcel-propagation": {
                const extensionMsg = parcelSyncMessage_1.ParcelSyncMessage.fromBytes(msg.getData().data);
                this.arrivedExtensionMessage.push(extensionMsg);
                if (this.log)
                    console.log(extensionMsg);
                break;
            }
            default:
                throw Error("Not implemented");
        }
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socket.end();
        });
    }
}
exports.P2pLayer = P2pLayer;
