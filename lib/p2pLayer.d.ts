/// <reference types="node" />
import { ExtensionMessage } from "./p2pMessage";
import { BlockSyncMessage } from "./blockSyncMessage";
import { ParcelSyncMessage } from "./parcelSyncMessage";
import { H256 } from "codechain-primitives";
import { U256 } from "codechain-primitives";
export declare class P2pLayer {
    private ip;
    private port;
    private session;
    private socket;
    private allowedFinish;
    private arrivedExtensionMessage;
    private tcpBuffer;
    private genesisHash;
    private recentHeaderNonce;
    private recentBodyNonce;
    private log;
    constructor(ip: string, port: number);
    setLog(): void;
    getGenesisHash(): H256;
    getArrivedExtensionMessage(): Array<BlockSyncMessage | ParcelSyncMessage>;
    getHeaderNonce(): U256;
    getBodyNonce(): U256;
    connect(): Promise<{}>;
    private sendP2pMessage;
    sendExtensionMessage(extensionName: string, extensionVersion: U256, data: Buffer, needEncryption: boolean): Promise<void>;
    private writeData;
    onP2pMessage(data: any): boolean;
    onExtensionMessage(msg: ExtensionMessage): void;
    close(): Promise<void>;
}
