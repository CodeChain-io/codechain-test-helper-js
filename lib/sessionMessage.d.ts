/// <reference types="node" />
import { H512 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
export declare enum MessageType {
    NODE_ID_REQUEST = 1,
    NODE_ID_RESPONSE = 2,
    SECRET_REQUEST = 3,
    SECRET_ALLOWED = 4,
    SECRET_DENIED = 5,
    NONCE_REQUEST = 6,
    NONCE_ALLOWED = 7,
    NONCE_DENIED = 8
}
interface IBody {
    toEncodeObject: () => Array<any> | number | string;
    protocolId: () => MessageType;
    getItem: () => any;
}
declare type Body = NodeIdRequest | NodeIdResponse | SecretRequest | SecretAllowed | SecretDenied | NonceRequest | NonceAllowed | NonceDenied;
export declare class SessionMessage {
    private version;
    private seq;
    private body;
    constructor(version: number, seq: U256, body: Body);
    setVersion(version: number): void;
    setSeq(seq: U256): void;
    setBody(body: Body): void;
    getVersion(): number;
    getSeq(): U256;
    getBody(): IBody;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): SessionMessage;
}
interface INodeId {
    ip: string;
    port: number;
}
export declare class NodeId {
    ip: string;
    port: number;
    constructor(ip: string, port: number);
    setIp(ip: string): void;
    setPort(port: number): void;
    getIp(): string;
    getPort(): number;
    toEncodeObject(): Array<any> | number | string;
}
export declare class NodeIdRequest implements IBody {
    private nodeid;
    constructor(obj?: INodeId);
    setNodeid(obj: INodeId): void;
    getItem(): NodeId;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class NodeIdResponse implements IBody {
    private nodeid;
    constructor(obj?: INodeId);
    setNodeid(obj: INodeId): void;
    getItem(): NodeId;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class SecretRequest implements IBody {
    private pub;
    constructor(pub: H512);
    setPub(pub: H512): void;
    getItem(): H512;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class SecretAllowed implements IBody {
    private pub;
    constructor(pub: H512);
    setPub(pub: H512): void;
    getItem(): H512;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class SecretDenied implements IBody {
    private reason;
    constructor(reason: string);
    setReason(reason: string): void;
    getItem(): string;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class NonceRequest implements IBody {
    private nonce;
    constructor(nonce: Buffer);
    setnonce(nonce: Buffer): void;
    getItem(): Buffer;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class NonceAllowed implements IBody {
    private nonce;
    constructor(nonce: Buffer);
    setnonce(nonce: Buffer): void;
    getItem(): Buffer;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export declare class NonceDenied implements IBody {
    private reason;
    constructor(reason: string);
    setReason(reason: string): void;
    getItem(): string;
    toEncodeObject(): Array<any> | number | string;
    protocolId(): number;
}
export {};
