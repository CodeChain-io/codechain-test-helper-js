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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
import { NodeId } from "./sessionMessage";

const RLP = require("rlp");

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
    private body: SyncMessage | AckMessage;

    constructor(body: SyncMessage | AckMessage) {
        this.body = body;
    }

    toEncodeObject(): Array<any> {
        return this.body.toEncodeObject();
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    fromBytes(bytes: Buffer): HandshakeMessage {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].readUIntBE(0, 1);
        const protocolId = decodedbytes[1].readUIntBE(0, 1);

        switch (protocolId) {
            case MessageType.SYNC_ID: {
                const body = new SyncMessage(
                    version,
                    decodedbytes[2],
                    decodedbytes[3]
                );
                return new HandshakeMessage(body);
            }
            case MessageType.ACK_ID: {
                const body = new AckMessage(version);
                return new HandshakeMessage(body);
            }
            default:
                throw Error("Unreachable");
        }
    }
}

export class SyncMessage {
    private version: number;
    private port: number;
    private nodeId: NodeId;

    constructor(version: number, port: number, nodeId: NodeId) {
        this.version = version;
        this.port = port;
        this.nodeId = nodeId;
    }

    protocolId(): number {
        return MessageType.SYNC_ID;
    }

    toEncodeObject(): Array<any> {
        return [
            this.version,
            this.protocolId(),
            this.port,
            this.nodeId.toEncodeObject()
        ];
    }
}

export class AckMessage {
    private version: number;

    constructor(version: number) {
        this.version = version;
    }

    protocolId(): number {
        return MessageType.ACK_ID;
    }

    toEncodeObject(): Array<any> {
        return [this.version, this.protocolId()];
    }
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

    fromBytes(bytes: Buffer): NegotiationMessage {
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
        data: IData
    ) {
        this.version = version;
        this.extensionName = extensionName;
        this.extensionVersion = extensionVersion;
        this.data = data;
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

    fromBytes(bytes: Buffer): ExtensionMessage {
        const decodedbytes = RLP.decode(bytes);
        const version = decodedbytes[0].readUIntBE(0, 1);
        const protocolId = decodedbytes[1].readUIntBE(0, 1);
        const extensionName = decodedbytes[2];
        const extensionVersion = decodedbytes[3];
        const data = decodedbytes[4];

        switch (protocolId) {
            case MessageType.ENCRYPTED_ID:
                return new ExtensionMessage(
                    version,
                    extensionName,
                    extensionVersion,
                    { type: "encrypted", data }
                );
            case MessageType.UNENCRYPTED_ID:
                return new ExtensionMessage(
                    version,
                    extensionName,
                    extensionVersion,
                    { type: "unencrypted", data }
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
