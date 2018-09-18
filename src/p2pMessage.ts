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
import { NodeId } from "./sessionMessage";
import { H256 } from "codechain-sdk/lib/core/H256";
import { H128 } from "codechain-sdk/lib/core/H128";
import { blake256WithKey } from "codechain-sdk/lib/utils";

const RLP = require("rlp");
const CRYPTO = require("crypto");
const ALGORITHM = "AES-256-CBC";

export enum MessageType {
    SYNC_ID = 0x00,
    ACK_ID,
    REQUEST_ID,
    ALLOWED_ID,
    DENIED_ID,
    ENCRYPTED_ID,
    UNENCRYPTED_ID
}

export class HandshakeMessage {
    private body: HandshakeBody;

    constructor(body: HandshakeBody) {
        this.body = body;
    }

    protocolId(): number {
        switch (this.body.type) {
            case "sync": {
                return MessageType.SYNC_ID;
            }
            case "sync": {
                return MessageType.ACK_ID;
            }
            default:
                throw Error("Unreachable");
        }
    }

    toEncodeObject(): Array<any> {
        switch (this.body.type) {
            case "sync": {
                return [
                    this.body.version,
                    this.protocolId(),
                    this.body.port,
                    this.body.nodeId.toEncodeObject()
                ];
            }
            case "ack": {
                return [this.body.version, this.protocolId()];
            }
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): HandshakeMessage {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].readUIntBE(0, 1);
        const protocolId = decodedbytes[1].readUIntBE(0, 1);

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

type HandshakeBody = HandshakeSync | HandshakeAck;

interface HandshakeSync {
    type: "sync";
    version: number;
    port: number;
    nodeId: NodeId;
}

interface HandshakeAck {
    type: "ack";
    version: number;
}

const COMMON = 3;

export class NegotiationMessage {
    private version: number;
    private seq: number;
    private body: NegotiationBody;

    constructor(version: number, seq: number, body: NegotiationBody) {
        this.version = version;
        this.seq = seq;
        this.body = body;
    }

    protocolId(): number {
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

    item_count(): number {
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

    toEncodeObject(): Array<any> {
        switch (this.body.type) {
            case "request":
                return [
                    this.version,
                    this.protocolId(),
                    this.seq,
                    this.body.extensionName,
                    this.body.extensionVersion
                ];
            case "allowed":
                return [
                    this.version,
                    this.protocolId(),
                    this.seq,
                    this.body.version
                ];
            case "denied":
                return [this.version, this.protocolId(), this.seq];
            default:
                throw Error("Unreachable");
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): NegotiationMessage {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].readUIntBE(0, 1);
        const protocolId = decodedbytes[1].readUIntBE(0, 1);
        const seq = decodedbytes[2].readUIntBE(0, 1);

        switch (protocolId) {
            case MessageType.REQUEST_ID: {
                const extensionName = decodedbytes[COMMON];
                const extensionVersion = decodedbytes[COMMON + 1];

                return new NegotiationMessage(version, seq, {
                    type: "request",
                    extensionName,
                    extensionVersion
                });
            }
            case MessageType.ALLOWED_ID:
                return new NegotiationMessage(version, seq, {
                    type: "allowed",
                    version: decodedbytes[COMMON].readUIntBE(0, 1)
                });
            case MessageType.DENIED_ID:
                return new NegotiationMessage(version, seq, { type: "denied" });
            default:
                throw Error("Unreachable");
        }
    }
}

type NegotiationBody =
    | INegotiationRequest
    | INegotiationAllowed
    | INegotiationDenied;

interface INegotiationRequest {
    type: "request";
    extensionName: string;
    extensionVersion: Array<number>;
}

interface INegotiationAllowed {
    type: "allowed";
    version: number;
}

interface INegotiationDenied {
    type: "denied";
}

export class ExtensionMessage {
    private version: number;
    private extensionName: string;
    private extensionVersion: number;
    private data: IData;

    constructor(
        version: number,
        extensionName: string,
        extensionVersion: number,
        data: IData,
        secret?: H256,
        nonce?: H128
    ) {
        this.version = version;
        this.extensionName = extensionName;
        this.extensionVersion = extensionVersion;

        if (data.type === "encrypted") {
            if (secret === undefined)
                throw Error("The secret is needed to make Encrypted Message");
            if (nonce === undefined)
                throw Error("The nonce is needed to make Encrypted Message");
            const key = new Buffer(secret.toEncodeObject().slice(2), "hex");
            const iv = new Buffer(nonce.toEncodeObject().slice(2), "hex");
            const encryptor = CRYPTO.createCipheriv(ALGORITHM, key, iv);
            encryptor.write(data.data);
            encryptor.end();
            this.data = { type: data.type, data: new Buffer(encryptor.read()) };
        } else {
            this.data = data;
        }
    }

    protocolId(): number {
        switch (this.data.type) {
            case "encrypted":
                return MessageType.ENCRYPTED_ID;
            case "unencrypted":
                return MessageType.UNENCRYPTED_ID;
            default:
                throw Error("Unreachable");
        }
    }

    toEncdoeObject(): Array<any> {
        return [
            this.version,
            this.protocolId(),
            this.extensionName,
            this.extensionVersion,
            `0x${this.data.data.toString("hex")}`
        ];
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncdoeObject());
    }

    static fromBytes(
        bytes: Buffer,
        secret?: H256,
        nonce?: H128
    ): ExtensionMessage {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].readUIntBE(0, 1);
        const protocolId = decodedbytes[1].readUIntBE(0, 1);
        const extensionName = decodedbytes[2];
        const extensionVersion = decodedbytes[3];
        const data = decodedbytes[4];

        switch (protocolId) {
            case MessageType.ENCRYPTED_ID: {
                if (secret === undefined)
                    throw Error(
                        "The secret is needed to encode Encrypted Message"
                    );
                if (nonce === undefined)
                    throw Error(
                        "The nonce is needed to encode Encrypted Message"
                    );
                const key = new Buffer(secret.toEncodeObject().slice(2), "hex");
                const iv = new Buffer(nonce.toEncodeObject().slice(2), "hex");
                const decryptor = CRYPTO.createDecipheriv(ALGORITHM, key, iv);
                decryptor.write(data);
                decryptor.end();
                return new ExtensionMessage(
                    version,
                    extensionName,
                    extensionVersion,
                    { type: "unencrypted", data: decryptor.read() },
                    secret,
                    nonce
                );
            }
            case MessageType.UNENCRYPTED_ID:
                return new ExtensionMessage(
                    version,
                    extensionName,
                    extensionVersion,
                    { type: "unencrypted", data },
                    secret,
                    nonce
                );
            default:
                throw Error("Unreachable");
        }
    }
}

type IData = IEncryptedData | IUnencryptedData;

interface IEncryptedData {
    type: "encrypted";
    data: Buffer;
}

interface IUnencryptedData {
    type: "unencrypted";
    data: Buffer;
}

type Message = HandshakeMessage | NegotiationMessage | ExtensionMessage;

export class SignedMessage {
    private message: Buffer;
    private signature: H256;

    constructor(message: Message, nonce: H128) {
        this.message = message.rlpBytes();
        this.signature = new H256(
            blake256WithKey(
                this.message,
                new Uint8Array([
                    ...new Buffer(nonce.toEncodeObject().slice(2), "hex")
                ])
            )
        );
    }

    toEncodeObject(): Array<any> {
        return [
            `0x${this.message.toString("hex")}`,
            this.signature.toEncodeObject()
        ];
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer, nonce?: H128, secret?: H256) {
        const decodedbytes = RLP.decode(bytes);
        const message = decodedbytes[0];
        // const signature = decodedbytes[1];

        const protocol = RLP.decode(message)[1].readUIntBE(0, 1);
        switch (protocol) {
            case MessageType.ACK_ID: {
                console.log("Got ACK_ID message");
                const msg = HandshakeMessage.fromBytes(message);
                console.log(msg);
                break;
            }
            case MessageType.SYNC_ID: {
                console.log("Got SYNC_ID message");
                break;
            }
            case MessageType.REQUEST_ID: {
                console.log("Got REQUEST_ID message");
                break;
            }
            case MessageType.ALLOWED_ID: {
                console.log("Got ALLOWED_ID message");
                const msg = NegotiationMessage.fromBytes(message);
                console.log(msg);
                break;
            }
            case MessageType.DENIED_ID: {
                console.log("Got DENIED_ID message");
                break;
            }
            case MessageType.ENCRYPTED_ID: {
                console.log("Got ENCRYPTED_ID message");
                if (secret === undefined)
                    throw Error(
                        "The secret is needed to decode Encrypted Message"
                    );
                if (nonce === undefined)
                    throw Error(
                        "The nonce is needed to decode Encrypted Message"
                    );
                const msg = ExtensionMessage.fromBytes(message, secret, nonce);
                console.log(msg);
                break;
            }
            case MessageType.UNENCRYPTED_ID: {
                console.log("Got UNENCRYPTED_ID message");
                const msg = ExtensionMessage.fromBytes(message, secret, nonce);
                console.log(msg);
                break;
            }
            default: {
                throw Error("Got Invalid p2p message");
            }
        }
    }
}
