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
import { P2pLayer } from "./p2pLayer";
import {
    BlockSyncMessage,
    ResponseMessage,
    MessageType,
    IHeadersq,
    IBodiesq,
    Emitter
} from "./blockSyncMessage";
import { ParcelSyncMessage } from "./parcelSyncMessage";
import { H160 } from "codechain-sdk/lib/core/H160";
import { H256 } from "codechain-sdk/lib/core/H256";
import { U256 } from "codechain-sdk/lib/core/U256";
import { Header } from "./cHeader";
import { SignedParcel } from "codechain-sdk/lib/core/SignedParcel";

type EncodedHeaders = Array<Array<Buffer>>;
type EncodedParcels = Array<Array<Buffer>>;
type EncodedBodies = Array<Array<Array<Buffer>>>;

export class TestHelper {
    private p2psocket: P2pLayer;
    private log: boolean;

    constructor(ip: string, port: number) {
        this.p2psocket = new P2pLayer(ip, port);
        this.log = false;
    }

    setLog() {
        this.log = true;
        this.p2psocket.setLog();
    }

    async establish(bestHash?: H256, bestScore?: U256) {
        await this.p2psocket.connect();

        let isStatusArrived;
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "status") {
                isStatusArrived = true;
            }
        }
        if (!isStatusArrived) await this.waitStatusMessage();

        const score =
            bestScore == undefined ? new U256("99999999999999999") : bestScore;
        const best =
            bestHash == undefined
                ? new H256(
                      "0x649fb35c0e304eb601ae71fe330729a2c1a27687ae7e2b0170866b86047a7bb9"
                  )
                : bestHash;
        const genesis = this.p2psocket.getGenesisHash();
        this.sendStatus(score, best, genesis);

        await this.waitHeaderRequest();

        if (this.log) console.log("Connected\n");
    }

    async end() {
        await this.p2psocket.close();
    }

    // Get block headers from the most recent header response
    getBlockHeaderResponse(): EncodedHeaders | null {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "response") {
                const responseMsgBody = responseBody.message.getBody();
                if (responseMsgBody.type === "headers") {
                    return responseMsgBody.data;
                }
            }
        }
        return null;
    }

    // Get block bodies from the most recent body response
    getBlockBodyResponse(): EncodedBodies | null {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const responseBody = msg.getBody();
            if (responseBody.type === "response") {
                const responseMsgBody = responseBody.message.getBody();
                if (responseMsgBody.type === "bodies") {
                    return responseMsgBody.data;
                }
            }
        }
        return null;
    }

    // Get the most recent parcel sync message from the node
    getParcelSyncMessage(): EncodedHeaders | null {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "parcels") {
                return requestBody.data;
            }
        }
        return null;
    }

    // Get the most recent block header request from the node
    getBlockHeaderRequest(): IHeadersq | null {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "request") {
                const requestMsgBody = requestBody.message.getBody();
                if (requestMsgBody.type === "headers") {
                    return requestMsgBody;
                }
            }
        }
        return null;
    }

    // Get the most recent block body request from the node
    getBlockBodyRequest(): IBodiesq | null {
        for (const msg of this.p2psocket
            .getArrivedExtensionMessage()
            .reverse()) {
            const requestBody = msg.getBody();
            if (requestBody.type === "request") {
                const requestMsgBody = requestBody.message.getBody();
                if (requestMsgBody.type === "bodies") {
                    return requestMsgBody;
                }
            }
        }
        return null;
    }

    async sendStatus(score: U256, bestHash: H256, genesisHash: H256) {
        const msg = new BlockSyncMessage({
            type: "status",
            totalScore: score,
            bestHash,
            genesisHash
        });
        await this.p2psocket.sendExtensionMessage(
            "block-propagation",
            0,
            msg.rlpBytes(),
            false
        );
    }

    async sendBlockHeaderResponse(headers: EncodedHeaders) {
        const message = new ResponseMessage({ type: "headers", data: headers });
        const msg = new BlockSyncMessage({
            type: "response",
            id: this.p2psocket.getHeaderNonce(),
            message
        });
        await this.p2psocket.sendExtensionMessage(
            "block-propagation",
            0,
            msg.rlpBytes(),
            false
        );
    }

    async sendBlockBodyResponse(bodies: EncodedBodies) {
        const message = new ResponseMessage({ type: "bodies", data: bodies });
        const msg = new BlockSyncMessage({
            type: "response",
            id: this.p2psocket.getBodyNonce(),
            message
        });
        await this.p2psocket.sendExtensionMessage(
            "block-propagation",
            0,
            msg.rlpBytes(),
            false
        );
    }

    async sendParcelSyncMessage(parcels: EncodedParcels) {
        const message = new ParcelSyncMessage({
            type: "parcels",
            data: parcels
        });
        await this.p2psocket.sendExtensionMessage(
            "parcel-propagation",
            0,
            message.rlpBytes(),
            false
        );
    }

    async sendEncodedBlock(
        header: EncodedHeaders,
        body: EncodedBodies,
        bestBlockHash: H256,
        bestBlockScore: U256
    ) {
        if (this.log) console.log("Send blocks");
        const score = bestBlockScore;
        const best = bestBlockHash;
        const genesis = this.p2psocket.getGenesisHash();
        await this.sendStatus(score, best, genesis);

        await this.sendBlockHeaderResponse(header);
        if (this.log) console.log("Send header response");

        await this.waitBodyRequest();
        await this.sendBlockBodyResponse(body);
        if (this.log) console.log("Send body response");
    }

    async sendBlock(header: Array<Header>, body: Array<Array<SignedParcel>>) {
        if (this.log) console.log("Send blocks");
        const bestBlock = header[header.length - 1];
        const score = bestBlock.getScore();
        const best = bestBlock.hashing();
        const genesis = this.p2psocket.getGenesisHash();
        await this.sendStatus(score, best, genesis);

        await this.sendBlockHeaderResponse(
            header.map(header => header.toEncodeObject())
        );
        if (this.log) console.log("Send header response");

        await this.waitBodyRequest();
        await this.sendBlockBodyResponse(
            body.map(parcels => parcels.map(parcel => parcel.toEncodeObject()))
        );
        if (this.log) console.log("Send body response");
    }

    async sendEncodedParcel(parcels: EncodedParcels) {
        if (this.log) console.log("Send parcels");
        await this.sendParcelSyncMessage(parcels);
    }

    async sendParcel(parcels: Array<SignedParcel>) {
        if (this.log) console.log("Sned parcels");
        await this.sendParcelSyncMessage(
            parcels.map(parcel => parcel.toEncodeObject())
        );
    }

    private async waitForBlockSyncMessage(type: MessageType): Promise<{}> {
        return new Promise((resolve, reject) => {
            switch (type) {
                case MessageType.MESSAGE_ID_STATUS: {
                    Emitter.once("status", () => {
                        resolve();
                    });
                    break;
                }
                case MessageType.MESSAGE_ID_GET_HEADERS: {
                    Emitter.once("headerrequest", () => {
                        resolve();
                    });
                    break;
                }
                case MessageType.MESSAGE_ID_GET_BODIES: {
                    Emitter.once("bodyrequest", () => {
                        resolve();
                    });
                    break;
                }
                case MessageType.MESSAGE_ID_HEADERS: {
                    Emitter.once("headerresponse", () => {
                        resolve();
                    });
                    break;
                }
                case MessageType.MESSAGE_ID_BODIES: {
                    Emitter.once("headerresponse", () => {
                        resolve();
                    });
                    break;
                }
                default: {
                    console.error("Not implemented");
                    reject();
                }
            }
        });
    }

    async waitStatusMessage() {
        try {
            await this.waitForBlockSyncMessage(MessageType.MESSAGE_ID_STATUS);
        } catch (error) {
            console.error(error);
        }
    }

    async waitHeaderRequest() {
        try {
            await this.waitForBlockSyncMessage(
                MessageType.MESSAGE_ID_GET_HEADERS
            );
        } catch (error) {
            console.error(error);
        }
    }

    async waitBodyRequest() {
        try {
            await this.waitForBlockSyncMessage(
                MessageType.MESSAGE_ID_GET_BODIES
            );
        } catch (error) {
            console.error(error);
        }
    }

    async waitHeaderResponse() {
        try {
            await this.waitForBlockSyncMessage(MessageType.MESSAGE_ID_HEADERS);
        } catch (error) {
            console.error(error);
        }
    }

    async waitBodyResponse() {
        try {
            await this.waitForBlockSyncMessage(MessageType.MESSAGE_ID_BODIES);
        } catch (error) {
            console.error(error);
        }
    }

    soloGenesisBlockHeader(): Header {
        const parentHash = new H256(
            "0000000000000000000000000000000000000000000000000000000000000000"
        );
        const timestamp = 0;
        const number = 0;
        const author = new H160("0000000000000000000000000000000000000000");
        const extraData = Buffer.from([
            23,
            108,
            91,
            111,
            253,
            100,
            40,
            143,
            87,
            206,
            189,
            160,
            126,
            135,
            186,
            91,
            4,
            70,
            5,
            195,
            246,
            153,
            51,
            67,
            233,
            113,
            143,
            161,
            0,
            209,
            115,
            124
        ]);
        const parcelsRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const stateRoot = new H256(
            "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
        );
        const invoicesRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const score = new U256(131072);
        const seal: any[] = [];
        const header = new Header(
            parentHash,
            timestamp,
            number,
            author,
            extraData,
            parcelsRoot,
            stateRoot,
            invoicesRoot,
            score,
            seal
        );

        return header;
    }

    soloBlock1(parent: H256): Header {
        const parentHash = parent;
        const timestamp = 1537509963;
        const number = 1;
        const author = new H160("7777777777777777777777777777777777777777");
        const extraData = Buffer.alloc(0);
        const parcelsRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const stateRoot = new H256(
            "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
        );
        const invoicesRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const score = new U256(999999999999999);
        const seal: any[] = [];
        const header = new Header(
            parentHash,
            timestamp,
            number,
            author,
            extraData,
            parcelsRoot,
            stateRoot,
            invoicesRoot,
            score,
            seal
        );

        return header;
    }

    soloBlock2(parent: H256): Header {
        const parentHash = parent;
        const timestamp = 1537944287;
        const number = 2;
        const author = new H160("6666666666666666666666666666666666666666");
        const extraData = Buffer.alloc(0);
        const parcelsRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const stateRoot = new H256(
            "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
        );
        const invoicesRoot = new H256(
            "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
        );
        const score = new U256(999999999999999);
        const seal: any[] = [];
        const header = new Header(
            parentHash,
            timestamp,
            number,
            author,
            extraData,
            parcelsRoot,
            stateRoot,
            invoicesRoot,
            score,
            seal
        );

        return header;
    }
}
