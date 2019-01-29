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
import { H512 } from "codechain-primitives";

const RLP = require("rlp");

export enum MessageType {
    SECRET_REQUEST = 0x03,
    SECRET_ALLOWED,

    NONCE_REQUEST = 0x06,
    NONCE_ALLOWED
}

interface IBody {
    toEncodeObject: () => Array<any> | number | string;
    protocolId: () => MessageType;
    getItem: () => any;
}

type Body = SecretRequest | SecretAllowed | NonceRequest | NonceAllowed;

export class SessionMessage {
    private version: number;
    private body: IBody;

    constructor(version: number, body: Body) {
        this.version = version;
        this.body = body;
    }

    setVersion(version: number) {
        this.version = version;
    }

    setBody(body: Body) {
        this.body = body;
    }

    getVersion() {
        return this.version;
    }

    getBody() {
        return this.body;
    }

    toEncodeObject(): Array<any> {
        return [
            this.version,
            this.body.protocolId(),
            this.body.toEncodeObject()
        ];
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): SessionMessage {
        const [version, protocolId, bodyObject] = RLP.decode(bytes);
        switch (protocolId.readUIntBE(0, 1)) {
            case MessageType.SECRET_REQUEST: {
                const secret: H512 = new H512(bodyObject.toString("hex"));
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    new SecretRequest(secret)
                );
            }
            case MessageType.SECRET_ALLOWED: {
                const secret: H512 = new H512(bodyObject.toString("hex"));
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    new SecretAllowed(secret)
                );
            }
            case MessageType.NONCE_REQUEST: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    new NonceRequest(bodyObject)
                );
            }
            case MessageType.NONCE_ALLOWED: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    new NonceAllowed(bodyObject)
                );
            }
            default:
                throw Error("Unreachable");
        }
    }
}

export class NodeId {
    public ip: string; // x.x.x.x
    public port: number; // x

    constructor(ip: string, port: number) {
        this.ip = ip;
        this.port = port;
    }

    setIp(ip: string) {
        this.ip = ip;
    }

    setPort(port: number) {
        this.port = port;
    }

    getIp() {
        return this.ip;
    }

    getPort() {
        return this.port;
    }

    toEncodeObject(): Array<any> | number | string {
        const rlparray = this.ip
            .split(".")
            .map(octet => Number.parseInt(octet));
        rlparray.push(this.port);

        return rlparray;
    }
}

export class SecretRequest implements IBody {
    private pub: H512;

    constructor(pub: H512) {
        this.pub = pub;
    }

    setPub(pub: H512) {
        this.pub = pub;
    }

    getItem() {
        return this.pub;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.pub.toEncodeObject();
    }

    protocolId(): number {
        return MessageType.SECRET_REQUEST;
    }
}

export class SecretAllowed implements IBody {
    private pub: H512;

    constructor(pub: H512) {
        this.pub = pub;
    }

    setPub(pub: H512) {
        this.pub = pub;
    }

    getItem() {
        return this.pub;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.pub.toEncodeObject();
    }

    protocolId(): number {
        return MessageType.SECRET_ALLOWED;
    }
}

export class NonceRequest implements IBody {
    private nonce: Buffer;

    constructor(nonce: Buffer) {
        this.nonce = nonce;
    }

    setnonce(nonce: Buffer) {
        this.nonce = nonce;
    }

    getItem() {
        return this.nonce;
    }

    toEncodeObject(): Array<any> | number | string {
        return `0x${this.nonce.toString("hex")}`;
    }

    protocolId(): number {
        return MessageType.NONCE_REQUEST;
    }
}

export class NonceAllowed implements IBody {
    private nonce: Buffer;

    constructor(nonce: Buffer) {
        this.nonce = nonce;
    }

    setnonce(nonce: Buffer) {
        this.nonce = nonce;
    }

    getItem() {
        return this.nonce;
    }

    toEncodeObject(): Array<any> | number | string {
        return `0x${this.nonce.toString("hex")}`;
    }

    protocolId(): number {
        return MessageType.NONCE_ALLOWED;
    }
}
