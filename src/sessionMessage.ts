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
import { H128 } from "codechain-sdk/lib/core/H128";
import { H256 } from "codechain-sdk/lib/core/H256";
import { H512 } from "codechain-sdk/lib/core/H512";

const RLP = require("rlp");

export default class Connection {

}

// Session message
interface IBody {
    toEncodeObject: () => Array<any> | number | string;
    protocolId: () => number;
}

type Body = NodeIdRequest | NodeIdResponse | SecretRequest | SecretAllowed | SecretDenied | NonceRequest | NonceAllowed | NonceDenied;

export class SessionMessage {
    private version: number;
    private seq: number;
    private body: Body;

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
        return [this.version, this.seq, this.body.protocolId(), this.body.toEncodeObject()];

    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }
}

export class NodeIdResponse implements IBody {
    private nodeid: NodeId;

    constructor(obj?: INodeId) {
        const ip = obj && obj.ip || "0.0.0.0";
        const port = obj && obj.port || 3485;
        this.nodeid = new NodeId(ip, port);
    }

    setNodeid(obj: INodeId) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }

    getNodeid() {
        return this.nodeid;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.nodeid.toEncodeObject();
    }
    
    protocolId(): number {
        return 2;
    }
}

export class NodeIdRequest implements IBody {
    private nodeid: NodeId;

    constructor(obj?: INodeId) {
        const ip = obj && obj.ip || "0.0.0.0";
        const port = obj && obj.port || 3485;
        this.nodeid = new NodeId(ip, port);
    }

    setNodeid(obj: INodeId) {
        this.nodeid.setIp(obj.ip);
        this.nodeid.setPort(obj.port);
    }

    getNodeid() {
        return this.nodeid;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.nodeid.toEncodeObject();
    }

    protocolId(): number {
        return 1;
    }
}

interface INodeId {
    ip: string;
    port: number;
}

class NodeId {
    private ip: string; // x.x.x.x
    private port: number; // x

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
        let rlparray = this.ip.split('.').map(octet => Number.parseInt(octet));
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

    getPub() {
        return this.pub;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.pub.toEncodeObject();
    }

    protocolId(): number {
        return 3;
    }
}

class SecretAllowed implements IBody {
    private pub: H512;

    constructor(pub: H512) {
        this.pub = pub;
    }

    setPub(pub: H512) {
        this.pub = pub;
    }

    getPub() {
        return this.pub;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.pub.toEncodeObject();
    }

    protocolId(): number {
        return 4;
    }
}

class SecretDenied implements IBody {
    private reason: string;

    constructor(reason: string) {
        this.reason = reason;
    }

    setReason(reason: string) {
        this.reason = reason;
    }

    getReason() {
        return this.reason;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.reason;
    }

    protocolId(): number {
        return 5;
    }
}

export class NonceRequest implements IBody {
    private body: H128;

    constructor(body: H128) {
        this.body = body;
    }

    setBody(body: H128) {
        this.body = body;
    }

    getBody() {
        return this.body;
    }

    toEncodeObject(): Array<any> | number | string {
        return `0x${this.body.rlpBytes().toString("hex")}`;
    }

    protocolId(): number {
        return 6;
    }
}

class NonceAllowed implements IBody {
    private body: H128;

    constructor(body: H128) {
        this.body = body;
    }

    setBody(body: H128) {
        this.body = body;
    }

    getBody() {
        return this.body;
    }

    toEncodeObject(): Array<any> | number | string {
        return `0x${this.body.rlpBytes().toString("hex")}`;
    }

    protocolId(): number {
        return 7;
    }
}

export class NonceDenied implements IBody {
    private body: string;

    constructor(body: string) {
        this.body = body;
    }

    setBody(body: string) {
        this.body = body;
    }

    getBody() {
        return this.body;
    }

    toEncodeObject(): Array<any> | number | string {
        return this.body;
    }

    protocolId(): number {
        return 8;
    }
}