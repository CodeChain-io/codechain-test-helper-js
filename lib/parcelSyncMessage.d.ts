/// <reference types="node" />
declare type parcelSyncMessageBody = IParcels;
interface IParcels {
    type: "parcels";
    data: Array<Array<Buffer>>;
}
export declare class ParcelSyncMessage {
    private body;
    constructor(body: parcelSyncMessageBody);
    getBody(): parcelSyncMessageBody;
    toEncodeObject(): Array<Array<any>>;
    rlpBytes(): Buffer;
    static fromBytes(bytes: Buffer): ParcelSyncMessage;
}
export {};
