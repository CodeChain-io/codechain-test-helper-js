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
const RLP = require("rlp");
const EventEmitter = require("events");
class EVENT extends EventEmitter {
}
exports.Emitter = new EVENT();
var MessageType;
(function (MessageType) {
    MessageType[MessageType["MESSAGE_ID_STATUS"] = 1] = "MESSAGE_ID_STATUS";
    MessageType[MessageType["MESSAGE_ID_GET_HEADERS"] = 2] = "MESSAGE_ID_GET_HEADERS";
    MessageType[MessageType["MESSAGE_ID_HEADERS"] = 3] = "MESSAGE_ID_HEADERS";
    MessageType[MessageType["MESSAGE_ID_GET_BODIES"] = 4] = "MESSAGE_ID_GET_BODIES";
    MessageType[MessageType["MESSAGE_ID_BODIES"] = 5] = "MESSAGE_ID_BODIES";
    MessageType[MessageType["MESSAGE_ID_GET_STATE_HEAD"] = 6] = "MESSAGE_ID_GET_STATE_HEAD";
    MessageType[MessageType["MESSAGE_ID_STATE_HEAD"] = 7] = "MESSAGE_ID_STATE_HEAD";
    MessageType[MessageType["MESSAGE_ID_GET_STATE_CHUNK"] = 8] = "MESSAGE_ID_GET_STATE_CHUNK";
    MessageType[MessageType["MESSAGE_ID_STATE_CHUNK"] = 9] = "MESSAGE_ID_STATE_CHUNK";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class BlockSyncMessage {
    constructor(body) {
        this.body = body;
    }
    getBody() {
        return this.body;
    }
    toEncodeObject() {
        switch (this.body.type) {
            case "status": {
                return [
                    MessageType.MESSAGE_ID_STATUS,
                    [
                        this.body.totalScore.toEncodeObject(),
                        this.body.bestHash.toEncodeObject(),
                        this.body.genesisHash.toEncodeObject()
                    ]
                ];
            }
            case "request": {
                return [
                    this.body.message.messageId(),
                    this.body.id.toEncodeObject(),
                    this.body.message.toEncodeObject()
                ];
            }
            case "response": {
                return [
                    this.body.message.messageId(),
                    this.body.id.toEncodeObject(),
                    this.body.message.toEncodeObject()
                ];
            }
            default:
                throw Error("Unreachable");
        }
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const decodedmsg = RLP.decode(bytes);
        const msgId = decodedmsg[0].length === 0 ? 0 : decodedmsg[0].readUIntBE(0, 1);
        if (msgId === MessageType.MESSAGE_ID_STATUS) {
            exports.Emitter.emit("status");
            const msg = decodedmsg[1];
            const totalScore = new codechain_primitives_2.U256(parseInt(msg[0].toString("hex"), 16));
            const bestHash = new codechain_primitives_1.H256(msg[1].toString("hex"));
            const genesisHash = new codechain_primitives_1.H256(msg[2].toString("hex"));
            return new BlockSyncMessage({
                type: "status",
                totalScore,
                bestHash,
                genesisHash
            });
        }
        else {
            const id = decodedmsg[1].length === 0
                ? new codechain_primitives_2.U256(0)
                : new codechain_primitives_2.U256(parseInt(decodedmsg[1].toString("hex"), 16));
            const msg = decodedmsg[2];
            switch (msgId) {
                case MessageType.MESSAGE_ID_GET_HEADERS:
                case MessageType.MESSAGE_ID_GET_BODIES:
                case MessageType.MESSAGE_ID_GET_STATE_HEAD:
                case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                    return new BlockSyncMessage({
                        type: "request",
                        id,
                        message: RequestMessage.decode(msgId, msg)
                    });
                }
                case MessageType.MESSAGE_ID_HEADERS:
                case MessageType.MESSAGE_ID_BODIES:
                case MessageType.MESSAGE_ID_STATE_HEAD:
                case MessageType.MESSAGE_ID_STATE_CHUNK: {
                    return new BlockSyncMessage({
                        type: "response",
                        id,
                        message: ResponseMessage.decode(msgId, msg)
                    });
                }
                default:
                    throw Error("Unreachable");
            }
        }
    }
}
exports.BlockSyncMessage = BlockSyncMessage;
class RequestMessage {
    constructor(body) {
        this.body = body;
    }
    getBody() {
        return this.body;
    }
    messageId() {
        switch (this.body.type) {
            case "headers": {
                return MessageType.MESSAGE_ID_GET_HEADERS;
            }
            case "bodies": {
                return MessageType.MESSAGE_ID_GET_BODIES;
            }
            case "statehead": {
                return MessageType.MESSAGE_ID_GET_STATE_HEAD;
            }
            case "statechunk": {
                return MessageType.MESSAGE_ID_GET_STATE_CHUNK;
            }
            default:
                throw Error("Unreachable");
        }
    }
    toEncodeObject() {
        switch (this.body.type) {
            case "headers": {
                return [
                    this.body.startNumber.toEncodeObject(),
                    this.body.maxCount.toEncodeObject()
                ];
            }
            case "bodies": {
                return this.body.data.map(hash => hash.toEncodeObject());
            }
            case "statehead": {
            }
            case "statechunk": {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject);
    }
    static decode(protocol, bytes) {
        switch (protocol) {
            case MessageType.MESSAGE_ID_GET_HEADERS: {
                exports.Emitter.emit("headerrequest");
                return new RequestMessage({
                    type: "headers",
                    startNumber: bytes[0].length === 0
                        ? new codechain_primitives_2.U256(0)
                        : new codechain_primitives_2.U256(parseInt(bytes[0].toString("hex"), 16)),
                    maxCount: bytes[1].length === 0
                        ? new codechain_primitives_2.U256(0)
                        : new codechain_primitives_2.U256(parseInt(bytes[1].toString("hex"), 16))
                });
            }
            case MessageType.MESSAGE_ID_GET_BODIES: {
                exports.Emitter.emit("bodyrequest");
                return new RequestMessage({
                    type: "bodies",
                    data: bytes.map(buf => new codechain_primitives_1.H256(buf.toString("hex")))
                });
            }
            case MessageType.MESSAGE_ID_GET_STATE_HEAD: {
            }
            case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
}
exports.RequestMessage = RequestMessage;
class ResponseMessage {
    constructor(body) {
        this.body = body;
    }
    getBody() {
        return this.body;
    }
    messageId() {
        switch (this.body.type) {
            case "headers": {
                return MessageType.MESSAGE_ID_HEADERS;
            }
            case "bodies": {
                return MessageType.MESSAGE_ID_BODIES;
            }
            case "stateheads": {
                return MessageType.MESSAGE_ID_GET_STATE_HEAD;
            }
            case "statechunks": {
                return MessageType.MESSAGE_ID_GET_STATE_CHUNK;
            }
            default:
                throw Error("Unreachable");
        }
    }
    toEncodeObject() {
        switch (this.body.type) {
            case "headers": {
                return this.body.data;
            }
            case "bodies": {
                return this.body.data;
            }
            case "stateheads": {
            }
            case "statechunks": {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static decode(protocol, bytes) {
        switch (protocol) {
            case MessageType.MESSAGE_ID_HEADERS: {
                exports.Emitter.emit("headerresponse");
                return new ResponseMessage({
                    type: "headers",
                    data: bytes
                });
            }
            case MessageType.MESSAGE_ID_GET_BODIES: {
                exports.Emitter.emit("bodyresponse");
                return new ResponseMessage({
                    type: "bodies",
                    data: bytes
                });
            }
            case MessageType.MESSAGE_ID_GET_STATE_HEAD: {
            }
            case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
}
exports.ResponseMessage = ResponseMessage;
