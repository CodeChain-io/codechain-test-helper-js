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
var MessageType;
(function (MessageType) {
    MessageType[MessageType["NODE_ID_REQUEST"] = 1] = "NODE_ID_REQUEST";
    MessageType[MessageType["NODE_ID_RESPONSE"] = 2] = "NODE_ID_RESPONSE";
    MessageType[MessageType["SECRET_REQUEST"] = 3] = "SECRET_REQUEST";
    MessageType[MessageType["SECRET_ALLOWED"] = 4] = "SECRET_ALLOWED";
    MessageType[MessageType["SECRET_DENIED"] = 5] = "SECRET_DENIED";
    MessageType[MessageType["NONCE_REQUEST"] = 6] = "NONCE_REQUEST";
    MessageType[MessageType["NONCE_ALLOWED"] = 7] = "NONCE_ALLOWED";
    MessageType[MessageType["NONCE_DENIED"] = 8] = "NONCE_DENIED";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class SessionMessage {
    constructor(version, seq, body) {
        this.version = version;
        this.seq = seq;
        this.body = body;
    }
    setVersion(version) {
        this.version = version;
    }
    setSeq(seq) {
        this.seq = seq;
    }
    setBody(body) {
        this.body = body;
    }
    getVersion() {
        return this.version;
    }
    getSeq() {
        return this.seq;
    }
    getBody() {
        return this.body;
    }
    toEncodeObject() {
        return [
            this.version,
            this.seq.toEncodeObject(),
            this.body.protocolId(),
            this.body.toEncodeObject()
        ];
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const [version, seq, protocolId, bodyObject] = RLP.decode(bytes);
        switch (protocolId.readUIntBE(0, 1)) {
            case MessageType.NODE_ID_REQUEST: {
                const ip = bodyObject
                    .slice(0, 4)
                    .map((num) => num.length === 0
                    ? 0
                    : num.readUIntBE(0, 1).toString())
                    .join(".");
                const port = bodyObject[4].readUIntBE(0, 1);
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new NodeIdRequest(new NodeId(ip, port)));
            }
            case MessageType.NODE_ID_RESPONSE: {
                const ip = bodyObject
                    .slice(0, 4)
                    .map((num) => num.length === 0
                    ? 0
                    : num.readUIntBE(0, 1).toString())
                    .join(".");
                const port = bodyObject[4].readUIntBE(0, 1);
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new NodeIdResponse(new NodeId(ip, port)));
            }
            case MessageType.SECRET_REQUEST: {
                const secret = new codechain_primitives_1.H512(bodyObject.toString("hex"));
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new SecretRequest(secret));
            }
            case MessageType.SECRET_ALLOWED: {
                const secret = new codechain_primitives_1.H512(bodyObject.toString("hex"));
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new SecretAllowed(secret));
            }
            case MessageType.SECRET_DENIED: {
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new SecretDenied(bodyObject.toString()));
            }
            case MessageType.NONCE_REQUEST: {
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new NonceRequest(bodyObject));
            }
            case MessageType.NONCE_ALLOWED: {
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new NonceAllowed(bodyObject));
            }
            case MessageType.NONCE_DENIED: {
                return new SessionMessage(version.length === 0 ? 0 : version.readUIntBE(0, 1), seq.length === 0
                    ? new codechain_primitives_2.U256(0)
                    : new codechain_primitives_2.U256(parseInt(seq.toString("hex"), 16)), new NonceDenied(bodyObject.toString()));
            }
            default:
                throw Error("Unreachable");
        }
    }
}
exports.SessionMessage = SessionMessage;
class NodeId {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
    }
    setIp(ip) {
        this.ip = ip;
    }
    setPort(port) {
        this.port = port;
    }
    getIp() {
        return this.ip;
    }
    getPort() {
        return this.port;
    }
    toEncodeObject() {
        const rlparray = this.ip
            .split(".")
            .map(octet => Number.parseInt(octet));
        rlparray.push(this.port);
        return rlparray;
    }
}
exports.NodeId = NodeId;
class NodeIdRequest {
    constructor(obj) {
        const ip = (obj && obj.ip) || "0.0.0.0";
        const port = (obj && obj.port) || 3485;
        this.nodeid = new NodeId(ip, port);
    }
    setNodeid(obj) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }
    getItem() {
        return this.nodeid;
    }
    toEncodeObject() {
        return this.nodeid.toEncodeObject();
    }
    protocolId() {
        return MessageType.NODE_ID_REQUEST;
    }
}
exports.NodeIdRequest = NodeIdRequest;
class NodeIdResponse {
    constructor(obj) {
        const ip = (obj && obj.ip) || "0.0.0.0";
        const port = (obj && obj.port) || 3485;
        this.nodeid = new NodeId(ip, port);
    }
    setNodeid(obj) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }
    getItem() {
        return this.nodeid;
    }
    toEncodeObject() {
        return this.nodeid.toEncodeObject();
    }
    protocolId() {
        return MessageType.NODE_ID_RESPONSE;
    }
}
exports.NodeIdResponse = NodeIdResponse;
class SecretRequest {
    constructor(pub) {
        this.pub = pub;
    }
    setPub(pub) {
        this.pub = pub;
    }
    getItem() {
        return this.pub;
    }
    toEncodeObject() {
        return this.pub.toEncodeObject();
    }
    protocolId() {
        return MessageType.SECRET_REQUEST;
    }
}
exports.SecretRequest = SecretRequest;
class SecretAllowed {
    constructor(pub) {
        this.pub = pub;
    }
    setPub(pub) {
        this.pub = pub;
    }
    getItem() {
        return this.pub;
    }
    toEncodeObject() {
        return this.pub.toEncodeObject();
    }
    protocolId() {
        return MessageType.SECRET_ALLOWED;
    }
}
exports.SecretAllowed = SecretAllowed;
class SecretDenied {
    constructor(reason) {
        this.reason = reason;
    }
    setReason(reason) {
        this.reason = reason;
    }
    getItem() {
        return this.reason;
    }
    toEncodeObject() {
        return this.reason;
    }
    protocolId() {
        return MessageType.SECRET_DENIED;
    }
}
exports.SecretDenied = SecretDenied;
class NonceRequest {
    constructor(nonce) {
        this.nonce = nonce;
    }
    setnonce(nonce) {
        this.nonce = nonce;
    }
    getItem() {
        return this.nonce;
    }
    toEncodeObject() {
        return `0x${this.nonce.toString("hex")}`;
    }
    protocolId() {
        return MessageType.NONCE_REQUEST;
    }
}
exports.NonceRequest = NonceRequest;
class NonceAllowed {
    constructor(nonce) {
        this.nonce = nonce;
    }
    setnonce(nonce) {
        this.nonce = nonce;
    }
    getItem() {
        return this.nonce;
    }
    toEncodeObject() {
        return `0x${this.nonce.toString("hex")}`;
    }
    protocolId() {
        return MessageType.NONCE_ALLOWED;
    }
}
exports.NonceAllowed = NonceAllowed;
class NonceDenied {
    constructor(reason) {
        this.reason = reason;
    }
    setReason(reason) {
        this.reason = reason;
    }
    getItem() {
        return this.reason;
    }
    toEncodeObject() {
        return this.reason;
    }
    protocolId() {
        return MessageType.NONCE_DENIED;
    }
}
exports.NonceDenied = NonceDenied;
