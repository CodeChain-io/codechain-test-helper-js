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
import { H256, U128, U256 } from "codechain-primitives";
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
            case "ack": {
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
                    this.body.version.toEncodeObject(),
                    this.protocolId(),
                    this.body.port
                ];
            }
            case "ack": {
                return [this.body.version.toEncodeObject(), this.protocolId()];
            }
            default:
                throw Error("Unreachable");
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): HandshakeMessage {
        const decodedbytes = RLP.decode(bytes);
        const version =
            decodedbytes[0].length === 0
                ? new U256(0)
                : new U256(parseInt(decodedbytes[0].toString("hes"), 16));
        const protocolId =
            decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);

        switch (protocolId) {
            case MessageType.SYNC_ID: {
                return new HandshakeMessage({
                    type: "sync",
                    version,
                    port: decodedbytes[2]
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
    version: U256;
    port: number;
}

interface HandshakeAck {
    type: "ack";
    version: U256;
}

const COMMON = 3;

export class NegotiationMessage {
    private version: U256;
    private seq: U256;
    private body: NegotiationBody;

    constructor(version: U256, seq: U256, body: NegotiationBody) {
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
                    this.version.toEncodeObject(),
                    this.protocolId(),
                    this.seq.toEncodeObject(),
                    this.body.extensionName,
                    this.body.extensionVersion.map(version =>
                        version.toEncodeObject()
                    )
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

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): NegotiationMessage {
        const decodedbytes = RLP.decode(bytes);
        const version =
            decodedbytes[0].length === 0
                ? new U256(0)
                : new U256(parseInt(decodedbytes[0].toString("hex"), 16));
        const protocolId =
            decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);
        const seq =
            decodedbytes[2].length === 0
                ? new U256(0)
                : new U256(parseInt(decodedbytes[2].toString("hex"), 16));

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
                    version:
                        decodedbytes[COMMON].length === 0
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

type NegotiationBody =
    | INegotiationRequest
    | INegotiationAllowed
    | INegotiationDenied;

interface INegotiationRequest {
    type: "request";
    extensionName: string;
    extensionVersion: Array<U256>;
}

interface INegotiationAllowed {
    type: "allowed";
    version: U256;
}

interface INegotiationDenied {
    type: "denied";
}

export class ExtensionMessage {
    private version: U256;
    private extensionName: string;
    private extensionVersion: U256;
    private data: IData;

    constructor(
        version: U256,
        extensionName: string,
        extensionVersion: U256,
        data: IData,
        secret?: H256,
        nonce?: U128
    ) {
        this.version = version;
        this.extensionName = extensionName;
        this.extensionVersion = extensionVersion;

        if (data.type === "encrypted") {
            if (secret == undefined)
                throw Error("The secret is needed to make Encrypted Message");
            if (nonce == undefined)
                throw Error("The nonce is needed to make Encrypted Message");
            const key = Buffer.from(secret.toEncodeObject().slice(2), "hex");
            const iv = Buffer.from(nonce.toString(16).padStart(32, "0"), "hex");
            const encryptor = CRYPTO.createCipheriv(ALGORITHM, key, iv);
            encryptor.write(data.data);
            encryptor.end();
            this.data = {
                type: data.type,
                data: Buffer.from(encryptor.read())
            };
        } else {
            this.data = data;
        }
    }

    getName(): string {
        return this.extensionName;
    }

    getData(): IData {
        return this.data;
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

    toEncodeObject(): Array<any> {
        return [
            this.version.toEncodeObject(),
            this.protocolId(),
            this.extensionName,
            this.extensionVersion.toEncodeObject(),
            `0x${this.data.data.toString("hex")}`
        ];
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(
        bytes: Buffer,
        secret?: H256,
        nonce?: U128
    ): ExtensionMessage {
        const decodedbytes = RLP.decode(bytes);
        const version =
            decodedbytes[0].length === 0
                ? new U256(0)
                : new U256(parseInt(decodedbytes[0].toString("hex"), 16));
        const protocolId =
            decodedbytes[1].length === 0 ? 0 : decodedbytes[1].readUIntBE(0, 1);
        const extensionName = decodedbytes[2].toString();
        const extensionVersion =
            decodedbytes[3].length === 0
                ? new U256(0)
                : new U256(parseInt(decodedbytes[3].toString("hex"), 16));
        const data = decodedbytes[4];

        switch (protocolId) {
            case MessageType.ENCRYPTED_ID: {
                if (secret == undefined)
                    throw Error(
                        "The secret is needed to encode Encrypted Message"
                    );
                if (nonce == undefined)
                    throw Error(
                        "The nonce is needed to encode Encrypted Message"
                    );
                const key = Buffer.from(
                    secret.toEncodeObject().slice(2),
                    "hex"
                );
                const iv = Buffer.from(
                    nonce.toString(16).padStart(32, "0"),
                    "hex"
                );
                const decryptor = CRYPTO.createDecipheriv(ALGORITHM, key, iv);
                decryptor.write(data);
                decryptor.end();
                return new ExtensionMessage(
                    version,
                    extensionName,
                    extensionVersion,
                    { type: "encrypted", data: decryptor.read() },
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

    constructor(message: Message, nonce: U128) {
        this.message = message.rlpBytes();
        this.signature = new H256(
            blake256WithKey(
                this.message,
                new Uint8Array([
                    ...Buffer.from(nonce.toString(16).padStart(32, "0"), "hex")
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

    static fromBytes(bytes: Buffer, secret?: H256, nonce?: U128): Message {
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
                    throw Error(
                        "The secret is needed to decode Encrypted Message"
                    );
                if (nonce == undefined)
                    throw Error(
                        "The nonce is needed to decode Encrypted Message"
                    );
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
