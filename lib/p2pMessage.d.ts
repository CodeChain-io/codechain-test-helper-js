/// <reference types="node" />
import { NodeId } from "./sessionMessage";
import { H256 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
import { H128 } from "codechain-primitives";
export declare enum MessageType {
    SYNC_ID = 0,
    ACK_ID = 1,
    REQUEST_ID = 2,
    ALLOWED_ID = 3,
    DENIED_ID = 4,
    ENCRYPTED_ID = 5,
    UNENCRYPTED_ID = 6
}
export declare class HandshakeMessage {
    private body;
    constructor(body: HandshakeBody);
    protocolId(): number;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): HandshakeMessage;
}
declare type HandshakeBody = HandshakeSync | HandshakeAck;
interface HandshakeSync {
    type: "sync";
    version: U256;
    port: number;
    nodeId: NodeId;
}
interface HandshakeAck {
    type: "ack";
    version: U256;
}
export declare class NegotiationMessage {
    private version;
    private seq;
    private body;
    constructor(version: U256, seq: U256, body: NegotiationBody);
    protocolId(): number;
    item_count(): number;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): NegotiationMessage;
}
declare type NegotiationBody = INegotiationRequest | INegotiationAllowed | INegotiationDenied;
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
export declare class ExtensionMessage {
    private version;
    private extensionName;
    private extensionVersion;
    private data;
    constructor(version: U256, extensionName: string, extensionVersion: U256, data: IData, secret?: H256, nonce?: H128);
    getName(): string;
    getData(): IData;
    protocolId(): number;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer, secret?: H256, nonce?: H128): ExtensionMessage;
}
declare type IData = IEncryptedData | IUnencryptedData;
interface IEncryptedData {
    type: "encrypted";
    data: Buffer;
}
interface IUnencryptedData {
    type: "unencrypted";
    data: Buffer;
}
declare type Message = HandshakeMessage | NegotiationMessage | ExtensionMessage;
export declare class SignedMessage {
    private message;
    private signature;
    constructor(message: Message, nonce: H128);
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer, nonce?: H128, secret?: H256): Message;
}
export {};
