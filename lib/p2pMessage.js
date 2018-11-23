"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codechain_primitives_1 = require("codechain-primitives");
const codechain_primitives_2 = require("codechain-primitives");
const utils_1 = require("codechain-sdk/lib/utils");
const RLP = require("rlp");
const CRYPTO = require("crypto");
const ALGORITHM = "AES-256-CBC";
var MessageType;
(function (MessageType) {
    MessageType[MessageType["SYNC_ID"] = 0] = "SYNC_ID";
    MessageType[MessageType["ACK_ID"] = 1] = "ACK_ID";
    MessageType[MessageType["REQUEST_ID"] = 2] = "REQUEST_ID";
    MessageType[MessageType["ALLOWED_ID"] = 3] = "ALLOWED_ID";
    MessageType[MessageType["DENIED_ID"] = 4] = "DENIED_ID";
    MessageType[MessageType["ENCRYPTED_ID"] = 5] = "ENCRYPTED_ID";
    MessageType[MessageType["UNENCRYPTED_ID"] = 6] = "UNENCRYPTED_ID";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class HandshakeMessage {
    constructor(body) {
        this.body = body;
    }
    protocolId() {
        switch (this.body.type) {
            case "sync": {
                return MessageType.SYNC_ID;
            }
            case "ack": {
                return MessageType.ACK_ID;
            }
            default:
                throw Error("Unreachable");
        }
    }
    toEncodeObject() {
        switch (this.body.type) {
            case "sync": {
                return [
                    this.body.version.toEncodeObject(),
                    this.protocolId(),
                    this.body.port,
                    this.body.nodeId.toEncodeObject()
                ];
            }
            case "ack": {
                return [this.body.version.toEncodeObject(), this.protocolId()];
            }
            default:
                throw Error("Unreachable");
        }
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].length === 0
            ? new codechain_primitives_2.U256(0)
            : new codechain_primitives_2.U256(parseInt(decodedbytes[0].toString("hes"), 16));
        const protocolId = decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);
        switch (protocolId) {
            case MessageType.SYNC_ID: {
                return new HandshakeMessage({
                    type: "sync",
                    version,
                    port: decodedbytes[2],
                    nodeId: decodedbytes[3]
                });
            }
            case MessageType.ACK_ID: {
                return new HandshakeMessage({ type: "ack", version });
            }
            default:
                throw Error("Unreachable");
        }
    }
}
exports.HandshakeMessage = HandshakeMessage;
const COMMON = 3;
class NegotiationMessage {
    constructor(version, seq, body) {
        this.version = version;
        this.seq = seq;
        this.body = body;
    }
    protocolId() {
        switch (this.body.type) {
            case "request":
                return MessageType.REQUEST_ID;
            case "allowed":
                return MessageType.ALLOWED_ID;
            case "denied":
                return MessageType.DENIED_ID;
            default:
                throw Error("Unreachable");
        }
    }
    item_count() {
        switch (this.body.type) {
            case "request":
                return COMMON + 2;
            case "allowed":
                return COMMON + 1;
            case "denied":
                return COMMON;
            default:
                throw Error("Unreachable");
        }
    }
    toEncodeObject() {
        switch (this.body.type) {
            case "request":
                return [
                    this.version.toEncodeObject(),
                    this.protocolId(),
                    this.seq.toEncodeObject(),
                    this.body.extensionName,
                    this.body.extensionVersion.map(version => version.toEncodeObject())
                ];
            case "allowed":
                return [
                    this.version.toEncodeObject(),
                    this.protocolId(),
                    this.seq.toEncodeObject(),
                    this.body.version.toEncodeObject()
                ];
            case "denied":
                return [
                    this.version.toEncodeObject(),
                    this.protocolId(),
                    this.seq.toEncodeObject()
                ];
            default:
                throw Error("Unreachable");
        }
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].length === 0
            ? new codechain_primitives_2.U256(0)
            : new codechain_primitives_2.U256(parseInt(decodedbytes[0].toString("hex"), 16));
        const protocolId = decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);
        const seq = decodedbytes[2].length === 0
            ? new codechain_primitives_2.U256(0)
            : new codechain_primitives_2.U256(parseInt(decodedbytes[2].toString("hex"), 16));
        switch (protocolId) {
            case MessageType.REQUEST_ID: {
                const extensionName = decodedbytes[COMMON];
                const extensionVersion = decodedbytes[COMMON + 1];
                return new NegotiationMessage(version, seq, {
                    type: "request",
                    extensionName,
                    // FIX ME: parse U256 array properly
                    extensionVersion
                });
            }
            case MessageType.ALLOWED_ID:
                return new NegotiationMessage(version, seq, {
                    type: "allowed",
                    version: decodedbytes[COMMON].length === 0
                        ? 0
                        : decodedbytes[COMMON].readUIntBE(0, 1)
                });
            case MessageType.DENIED_ID:
                return new NegotiationMessage(version, seq, { type: "denied" });
            default:
                throw Error("Unreachable");
        }
    }
}
exports.NegotiationMessage = NegotiationMessage;
class ExtensionMessage {
    constructor(version, extensionName, extensionVersion, data, secret, nonce) {
        this.version = version;
        this.extensionName = extensionName;
        this.extensionVersion = extensionVersion;
        if (data.type === "encrypted") {
            if (secret == undefined)
                throw Error("The secret is needed to make Encrypted Message");
            if (nonce == undefined)
                throw Error("The nonce is needed to make Encrypted Message");
            const key = Buffer.from(secret.toEncodeObject().slice(2), "hex");
            const iv = Buffer.from(nonce.toEncodeObject().slice(2), "hex");
            const encryptor = CRYPTO.createCipheriv(ALGORITHM, key, iv);
            encryptor.write(data.data);
            encryptor.end();
            this.data = {
                type: data.type,
                data: Buffer.from(encryptor.read())
            };
        }
        else {
            this.data = data;
        }
    }
    getName() {
        return this.extensionName;
    }
    getData() {
        return this.data;
    }
    protocolId() {
        switch (this.data.type) {
            case "encrypted":
                return MessageType.ENCRYPTED_ID;
            case "unencrypted":
                return MessageType.UNENCRYPTED_ID;
            default:
                throw Error("Unreachable");
        }
    }
    toEncodeObject() {
        return [
            this.version.toEncodeObject(),
            this.protocolId(),
            this.extensionName,
            this.extensionVersion.toEncodeObject(),
            `0x${this.data.data.toString("hex")}`
        ];
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes, secret, nonce) {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].length === 0
            ? new codechain_primitives_2.U256(0)
            : new codechain_primitives_2.U256(parseInt(decodedbytes[0].toString("hex"), 16));
        const protocolId = decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);
        const extensionName = decodedbytes[2].toString();
        const extensionVersion = decodedbytes[3].length === 0
            ? new codechain_primitives_2.U256(0)
            : new codechain_primitives_2.U256(parseInt(decodedbytes[3].toString("hex"), 16));
        const data = decodedbytes[4];
        switch (protocolId) {
            case MessageType.ENCRYPTED_ID: {
                if (secret == undefined)
                    throw Error("The secret is needed to encode Encrypted Message");
                if (nonce == undefined)
                    throw Error("The nonce is needed to encode Encrypted Message");
                const key = Buffer.from(secret.toEncodeObject().slice(2), "hex");
                const iv = Buffer.from(nonce.toEncodeObject().slice(2), "hex");
                const decryptor = CRYPTO.createDecipheriv(ALGORITHM, key, iv);
                decryptor.write(data);
                decryptor.end();
                return new ExtensionMessage(version, extensionName, extensionVersion, { type: "encrypted", data: decryptor.read() }, secret, nonce);
            }
            case MessageType.UNENCRYPTED_ID:
                return new ExtensionMessage(version, extensionName, extensionVersion, { type: "unencrypted", data }, secret, nonce);
            default:
                throw Error("Unreachable");
        }
    }
}
exports.ExtensionMessage = ExtensionMessage;
class SignedMessage {
    constructor(message, nonce) {
        this.message = message.rlpBytes();
        this.signature = new codechain_primitives_1.H256(utils_1.blake256WithKey(this.message, new Uint8Array([
            ...Buffer.from(nonce.toEncodeObject().slice(2), "hex")
        ])));
    }
    toEncodeObject() {
        return [
            `0x${this.message.toString("hex")}`,
            this.signature.toEncodeObject()
        ];
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes, nonce, secret) {
        const decodedbytes = RLP.decode(bytes);
        const message = decodedbytes[0];
        // const signature = decodedbytes[1];
        const protocol = RLP.decode(message)[1];
        switch (protocol.length === 0 ? 0 : protocol.readUIntBE(0, 1)) {
            case MessageType.SYNC_ID: {
                const msg = HandshakeMessage.fromBytes(message);
                return msg;
            }
            case MessageType.ACK_ID: {
                const msg = HandshakeMessage.fromBytes(message);
                return msg;
            }
            case MessageType.REQUEST_ID: {
                const msg = NegotiationMessage.fromBytes(message);
                return msg;
            }
            case MessageType.ALLOWED_ID: {
                const msg = NegotiationMessage.fromBytes(message);
                return msg;
            }
            case MessageType.DENIED_ID: {
                const msg = NegotiationMessage.fromBytes(message);
                return msg;
            }
            case MessageType.ENCRYPTED_ID: {
                if (secret == undefined)
                    throw Error("The secret is needed to decode Encrypted Message");
                if (nonce == undefined)
                    throw Error("The nonce is needed to decode Encrypted Message");
                const msg = ExtensionMessage.fromBytes(message, secret, nonce);
                return msg;
            }
            case MessageType.UNENCRYPTED_ID: {
                const msg = ExtensionMessage.fromBytes(message, secret, nonce);
                return msg;
            }
            default: {
                throw Error("Got Invalid RLP data of p2p message");
            }
        }
    }
}
exports.SignedMessage = SignedMessage;
