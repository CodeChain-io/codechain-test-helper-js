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
import { H512 } from "codechain-sdk/lib/core/H512";

const RLP = require("rlp");

export enum MessageType {
    NODE_ID_REQUEST = 0x01,
    NODE_ID_RESPONSE,

    SECRET_REQUEST,
    SECRET_ALLOWED,
    SECRET_DENIED,

    NONCE_REQUEST,
    NONCE_ALLOWED,
    NONCE_DENIED
}

interface IBody {
    toEncodeObject: () => Array<any> | number | string;
    protocolId: () => MessageType;
    getItem: () => any;
}

type Body =
    | NodeIdRequest
    | NodeIdResponse
    | SecretRequest
    | SecretAllowed
    | SecretDenied
    | NonceRequest
    | NonceAllowed
    | NonceDenied;

export class SessionMessage {
    private version: number;
    private seq: number;
    private body: IBody;

    constructor(version: number, seq: number, body: Body) {
        this.version = version;
        this.seq = seq;
        this.body = body;
    }

    setVersion(version: number) {
        this.version = version;
    }

    setSeq(seq: number) {
        this.seq = seq;
    }

    setBody(body: Body) {
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

    toEncodeObject(): Array<any> | number | string {
        return [
            this.version,
            this.seq,
            this.body.protocolId(),
            this.body.toEncodeObject()
        ];
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): SessionMessage {
        const [version, seq, protocolId, bodyObject] = RLP.decode(bytes);
        switch (protocolId.readUIntBE(0, 1)) {
            case MessageType.NODE_ID_REQUEST: {
                const ip: string = bodyObject
                    .slice(0, 4)
                    .map(
                        (num: any) =>
                            num.length === 0
                                ? 0
                                : num.readUIntBE(0, 1).toString()
                    )
                    .join(".");
                const port: number = bodyObject[4].readUIntBE(0, 1);
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new NodeIdRequest(new NodeId(ip, port))
                );
            }
            case MessageType.NODE_ID_RESPONSE: {
                const ip: string = bodyObject
                    .slice(0, 4)
                    .map(
                        (num: any) =>
                            num.length === 0
                                ? 0
                                : num.readUIntBE(0, 1).toString()
                    )
                    .join(".");
                const port: number = bodyObject[4].readUIntBE(0, 1);
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new NodeIdResponse(new NodeId(ip, port))
                );
            }
            case MessageType.SECRET_REQUEST: {
                const secret: H512 = new H512(bodyObject.toString("hex"));
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new SecretRequest(secret)
                );
            }
            case MessageType.SECRET_ALLOWED: {
                const secret: H512 = new H512(bodyObject.toString("hex"));
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new SecretAllowed(secret)
                );
            }
            case MessageType.SECRET_DENIED: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new SecretDenied(bodyObject.toString())
                );
            }
            case MessageType.NONCE_REQUEST: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new NonceRequest(bodyObject)
                );
            }
            case MessageType.NONCE_ALLOWED: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new NonceAllowed(bodyObject)
                );
            }
            case MessageType.NONCE_DENIED: {
                return new SessionMessage(
                    version.length === 0 ? 0 : version.readUIntBE(0, 1),
                    seq.length === 0 ? 0 : seq.readUIntBE(0, 1),
                    new NonceDenied(bodyObject.toString())
                );
            }
            default:
                throw Error("Unreachable");
        }
    }
}

interface INodeId {
    ip: string;
    port: number;
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

export class NodeIdRequest implements IBody {
    private nodeid: NodeId;

    constructor(obj?: INodeId) {
        const ip = (obj && obj.ip) || "0.0.0.0";
        const port = (obj && obj.port) || 3485;
        this.nodeid = new NodeId(ip, port);
    }

    setNodeid(obj: INodeId) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }

    getItem() {
        return this.nodeid;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.nodeid.toEncodeObject();
    }

    protocolId(): number {
        return MessageType.NODE_ID_REQUEST;
    }
}

export class NodeIdResponse implements IBody {
    private nodeid: NodeId;

    constructor(obj?: INodeId) {
        const ip = (obj && obj.ip) || "0.0.0.0";
        const port = (obj && obj.port) || 3485;
        this.nodeid = new NodeId(ip, port);
    }

    setNodeid(obj: INodeId) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }

    getItem() {
        return this.nodeid;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.nodeid.toEncodeObject();
    }

    protocolId(): number {
        return MessageType.NODE_ID_RESPONSE;
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

export class SecretDenied implements IBody {
    private reason: string;

    constructor(reason: string) {
        this.reason = reason;
    }

    setReason(reason: string) {
        this.reason = reason;
    }

    getItem() {
        return this.reason;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.reason;
    }

    protocolId(): number {
        return MessageType.SECRET_DENIED;
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

export class NonceDenied implements IBody {
    private reason: string;

    constructor(reason: string) {
        this.reason = reason;
    }

    setReason(reason: string) {
        this.reason = reason;
    }

    getItem() {
        return this.reason;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.reason;
    }

    protocolId(): number {
        return MessageType.NONCE_DENIED;
    }
}
