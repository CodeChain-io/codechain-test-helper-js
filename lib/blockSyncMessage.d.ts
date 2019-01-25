/// <reference types="node" />
import { H256 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
declare const EventEmitter: any;
declare class EVENT extends EventEmitter {
}
export declare const Emitter: EVENT;
export declare enum MessageType {
    MESSAGE_ID_STATUS = 1,
    MESSAGE_ID_GET_HEADERS = 2,
    MESSAGE_ID_HEADERS = 3,
    MESSAGE_ID_GET_BODIES = 4,
    MESSAGE_ID_BODIES = 5,
    MESSAGE_ID_GET_STATE_HEAD = 6,
    MESSAGE_ID_STATE_HEAD = 7,
    MESSAGE_ID_GET_STATE_CHUNK = 8,
    MESSAGE_ID_STATE_CHUNK = 9
}
declare type BlockSyncMessageBody = IStatus | IRequest | IResponse;
interface IStatus {
    type: "status";
    totalScore: U256;
    bestHash: H256;
    genesisHash: H256;
}
interface IRequest {
    type: "request";
    id: U256;
    message: RequestMessage;
}
interface IResponse {
    type: "response";
    id: U256;
    message: ResponseMessage;
}
export declare class BlockSyncMessage {
    private body;
    constructor(body: BlockSyncMessageBody);
    getBody(): BlockSyncMessageBody;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): BlockSyncMessage;
}
declare type requestMessageBody = IHeadersq | IBodiesq | IStateHeadq | IStateChunkq;
export interface IHeadersq {
    type: "headers";
    startNumber: U256;
    maxCount: U256;
}
export interface IBodiesq {
    type: "bodies";
    data: Array<H256>;
}
interface IStateHeadq {
    type: "statehead";
    data: H256;
}
interface IStateChunkq {
    type: "statechunk";
    blockHash: H256;
    treeRoot: H256;
}
export declare class RequestMessage {
    private body;
    constructor(body: requestMessageBody);
    getBody(): requestMessageBody;
    messageId(): number;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static decode(protocol: MessageType, bytes: Array<any>): RequestMessage;
}
declare type responseMessageBody = IHeaderss | IBodiess | IStateHeads | IStateChunks;
interface IHeaderss {
    type: "headers";
    data: Array<Array<Buffer>>;
}
interface IBodiess {
    type: "bodies";
    data: Array<Array<Array<Buffer>>>;
}
interface IStateHeads {
    type: "stateheads";
    data: Buffer;
}
interface IStateChunks {
    type: "statechunks";
    data: Buffer;
}
export declare class ResponseMessage {
    private body;
    constructor(body: responseMessageBody);
    getBody(): responseMessageBody;
    messageId(): number;
    toEncodeObject(): Array<any>;
    rlpBytes(): Buffer;
    static decode(protocol: MessageType, bytes: Array<any>): ResponseMessage;
}
export {};
