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
import { H256 } from "codechain-sdk/lib/core/H256";
import { U256 } from "codechain-sdk/lib/core/U256";

const RLP = require("rlp");

export enum MessageType {
    MESSAGE_ID_STATUS = 0x01,
    MESSAGE_ID_GET_HEADERS,
    MESSAGE_ID_HEADERS,
    MESSAGE_ID_GET_BODIES,
    MESSAGE_ID_BODIES,
    MESSAGE_ID_GET_STATE_HEAD,
    MESSAGE_ID_STATE_HEAD,
    MESSAGE_ID_GET_STATE_CHUNK,
    MESSAGE_ID_STATE_CHUNK
}

type BlockSyncMessageBody = IStatus | IRequest | IResponse;

interface IStatus {
    type: "status";
    totalScore: U256;
    bestHash: H256;
    genesisHash: H256;
}

interface IRequest {
    type: "request";
    id: MessageType;
    message: RequestMessage;
}

interface IResponse {
    type: "response";
    id: MessageType;
    message: ResponseMessage;
}

export class BlockSyncMessage {
    private body: BlockSyncMessageBody;

    constructor(body: BlockSyncMessageBody) {
        this.body = body;
    }

    getBody(): BlockSyncMessageBody {
        return this.body;
    }

    toEncodeObject(): Array<any> {
        switch (this.body.type) {
            case "status": {
                return [
                    MessageType.MESSAGE_ID_STATUS,
                    [
                        this.body.totalScore.toEncodeObject(),
                        this.body.bestHash.toEncodeObject(),
                        this.body.genesisHash.toEncodeObject()
                    ]
                ];
            }
            case "request": {
                return [
                    this.body.message.messageId(),
                    this.body.id,
                    this.body.message.toEncodeObject()
                ];
            }
            case "response": {
                return [
                    this.body.message.messageId(),
                    this.body.id,
                    this.body.message.toEncodeObject()
                ];
            }
            default:
                throw Error("Unreachable");
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static fromBytes(bytes: Buffer): BlockSyncMessage {
        const decodedmsg = RLP.decode(bytes);
        const msgId = decodedmsg[0].readUIntBE(0, 1);
        if (msgId === MessageType.MESSAGE_ID_STATUS) {
            const msg = decodedmsg[1];
            const totalScore = new U256(parseInt(msg[0].toString("hex"), 16));
            const bestHash = new H256(msg[1].toString("hex"));
            const genesisHash = new H256(msg[2].toString("hex"));
            return new BlockSyncMessage({
                type: "status",
                totalScore,
                bestHash,
                genesisHash
            });
        } else {
            const id = decodedmsg[1].readUIntBE(0, 1);
            const msg = decodedmsg[2];
            switch (msgId) {
                case MessageType.MESSAGE_ID_GET_HEADERS:
                case MessageType.MESSAGE_ID_GET_BODIES:
                case MessageType.MESSAGE_ID_GET_STATE_HEAD:
                case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                    return new BlockSyncMessage({
                        type: "request",
                        id,
                        message: RequestMessage.decode(msgId, msg)
                    });
                }
                case MessageType.MESSAGE_ID_HEADERS:
                case MessageType.MESSAGE_ID_BODIES:
                case MessageType.MESSAGE_ID_STATE_HEAD:
                case MessageType.MESSAGE_ID_STATE_CHUNK: {
                    return new BlockSyncMessage({
                        type: "response",
                        id,
                        message: ResponseMessage.decode(msgId, msg)
                    });
                }
                default:
                    throw Error("Unreachable");
            }
        }
    }
}

type requestMessageBody = IHeadersq | IBodiesq | IStateHeadq | IStateChunkq;

interface IHeadersq {
    type: "headers";
    startNumber: number;
    maxCount: number;
}

interface IBodiesq {
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

export class RequestMessage {
    private body: requestMessageBody;

    constructor(body: requestMessageBody) {
        this.body = body;
    }

    messageId(): number {
        switch (this.body.type) {
            case "headers": {
                return MessageType.MESSAGE_ID_GET_HEADERS;
            }
            case "bodies": {
                return MessageType.MESSAGE_ID_GET_BODIES;
            }
            case "statehead": {
                return MessageType.MESSAGE_ID_GET_STATE_HEAD;
            }
            case "statechunk": {
                return MessageType.MESSAGE_ID_GET_STATE_CHUNK;
            }
            default:
                throw Error("Unreachable");
        }
    }

    toEncodeObject(): Array<any> {
        switch (this.body.type) {
            case "headers": {
                return [this.body.startNumber, this.body.maxCount];
            }
            case "bodies": {
                return this.body.data.map(hash => hash.toEncodeObject());
            }
            case "statehead": {
            }
            case "statechunk": {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject);
    }

    static decode(protocol: MessageType, bytes: Array<any>): RequestMessage {
        switch (protocol) {
            case MessageType.MESSAGE_ID_GET_HEADERS: {
                return new RequestMessage({
                    type: "headers",
                    startNumber: bytes[0].readUIntBE(0, 1),
                    maxCount: bytes[1].readUIntBE(0, 1)
                });
            }
            case MessageType.MESSAGE_ID_GET_BODIES: {
                return new RequestMessage({
                    type: "bodies",
                    data: bytes[0]
                });
            }
            case MessageType.MESSAGE_ID_GET_STATE_HEAD: {
            }
            case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
}

type responseMessageBody = IHeaderss | IBodiess | IStateHeads | IStateChunks;

interface IHeaderss {
    type: "headers";
    data: Array<Buffer>;
}

interface IBodiess {
    type: "bodies";
    data: Array<Array<Buffer>>;
}

interface IStateHeads {
    type: "stateheads";
    data: Buffer;
}

interface IStateChunks {
    type: "statechunks";
    data: Buffer;
}

export class ResponseMessage {
    private body: responseMessageBody;

    constructor(body: responseMessageBody) {
        this.body = body;
    }

    getBody(): responseMessageBody {
        return this.body;
    }

    messageId(): number {
        switch (this.body.type) {
            case "headers": {
                return MessageType.MESSAGE_ID_HEADERS;
            }
            case "bodies": {
                return MessageType.MESSAGE_ID_BODIES;
            }
            case "stateheads": {
                return MessageType.MESSAGE_ID_GET_STATE_HEAD;
            }
            case "statechunks": {
                return MessageType.MESSAGE_ID_GET_STATE_CHUNK;
            }
            default:
                throw Error("Unreachable");
        }
    }

    toEncodeObject(): Array<any> {
        switch (this.body.type) {
            case "headers": {
                return this.body.data;
            }
            case "bodies": {
                return this.body.data;
            }
            case "stateheads": {
            }
            case "statechunks": {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }

    rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    static decode(protocol: MessageType, bytes: Array<any>): ResponseMessage {
        switch (protocol) {
            case MessageType.MESSAGE_ID_HEADERS: {
                return new ResponseMessage({
                    type: "headers",
                    data: bytes[0]
                });
            }
            case MessageType.MESSAGE_ID_GET_BODIES: {
                return new ResponseMessage({
                    type: "bodies",
                    data: bytes[0]
                });
            }
            case MessageType.MESSAGE_ID_GET_STATE_HEAD: {
            }
            case MessageType.MESSAGE_ID_GET_STATE_CHUNK: {
                throw Error("Not implemented");
            }
            default:
                throw Error("Unreachable");
        }
    }
}
