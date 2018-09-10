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
import { H512 } from "codechain-sdk/lib/core/H512";
import {
    MessageType,
    SessionMessage,
    NodeIdRequest,
    NodeIdResponse,
    SecretRequest,
    SecretAllowed,
    SecretDenied,
    NonceRequest,
    NonceAllowed,
    NonceDenied,
    NodeId
} from "./sessionMessage";

const CRYPTO = require("crypto");
const ALGORITHM = "AES-256-CBC";
const DGRAM = require("dgram");
const EC = require("elliptic").ec;

const MAX_PACKET_SIZE = 1024;
const PORT = 6602;

const ec = new EC("secp256k1");

export class Session {
    private targetIp: string;
    private targetPort: number;
    private socket: any;
    private key: null | any;
    private nonce: H128;
    private encodedSecret: null | Buffer;
    private targetNonce: null | H128;
    private targetPubkey: null | H512;

    constructor(ip: string, port: number) {
        this.targetIp = ip;
        this.targetPort = port;
        this.key = null;
        this.nonce = new H128("0x000000000000000000000000DEADBEEF");
        this.targetNonce = null;
        this.targetPubkey = null;
        this.encodedSecret = null;
    }

    setIp(ip: string) {
        this.targetIp = ip;
    }

    setPort(port: number) {
        this.targetPort = port;
    }

    setKey(key: any) {
        this.key = key;
    }

    setNonce(nonce: H128) {
        this.nonce = nonce;
    }

    setTargetNonce(nonce: H128) {
        this.targetNonce = nonce;
    }

    setTargetPubkey(pub: H512) {
        this.targetPubkey = pub;
    }

    getIp() {
        return this.targetIp;
    }

    getPort() {
        return this.targetPort;
    }

    getKey() {
        return this.key;
    }

    getNonce() {
        return this.nonce;
    }

    getTargetNonce() {
        return this.targetNonce;
    }

    getTargetPubkey() {
        return this.targetPubkey;
    }

    connect(): void {
        try {
            console.log("Start connecting");
            this.socket = DGRAM.createSocket("udp4");

            this.socket.on("error", (err: any) => {
                console.log(`server error:\n${err.stack}`);
                this.socket.close();
            });

            this.socket.on("listening", () => {
                try {
                    this.socket.setRecvBufferSize(MAX_PACKET_SIZE);
                    this.socket.setSendBufferSize(MAX_PACKET_SIZE);
                    this.sendSessionMessage(MessageType.NODE_ID_REQUEST);
                    const address = this.socket.address();
                    console.log(
                        "UDP Server listening on " +
                            address.address +
                            ":" +
                            address.port
                    );
                } catch (err) {
                    console.error(err);
                }
            });

            this.socket.on("message", (msg: any, rinfo: any) => {
                try {
                    const sessionMsg = SessionMessage.fromBytes(msg);
                    switch (sessionMsg.getBody().protocolId()) {
                        case MessageType.NODE_ID_RESPONSE: {
                            console.log(
                                `Received: NODE_ID_RESPONSE from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            this.key = ec.genKeyPair();
                            this.sendSessionMessage(MessageType.SECRET_REQUEST);

                            break;
                        }

                        case MessageType.SECRET_ALLOWED: {
                            console.log(
                                `Received: SECRET_ALLOWED from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            this.targetPubkey = sessionMsg.getBody().getItem();
                            if (this.targetPubkey === null) {
                                throw Error("The key is not defined");
                            }
                            const pubKey = ec
                                .keyFromPublic(
                                    "04".concat(
                                        this.targetPubkey
                                            .toEncodeObject()
                                            .slice(2)
                                    ),
                                    "hex"
                                )
                                .getPublic();
                            const sharedSecret = this.key.derive(pubKey);
                            const encodedNonce = this.nonce.rlpBytes();

                            const iv = new Buffer(
                                "00000000000000000000000000000000",
                                "hex"
                            );
                            const key = new Buffer(
                                sharedSecret.toString(16),
                                "hex"
                            );
                            const encryptor = CRYPTO.createCipheriv(
                                ALGORITHM,
                                key,
                                iv
                            );

                            encryptor.write(encodedNonce);
                            encryptor.end();
                            this.encodedSecret = new Buffer(encryptor.read());
                            this.sendSessionMessage(MessageType.NONCE_REQUEST);
                            break;
                        }
                        case MessageType.SECRET_DENIED: {
                            console.log(
                                `Received: SECRET_DENIED from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            throw Error(sessionMsg.getBody().getItem());
                        }

                        case MessageType.NONCE_ALLOWED: {
                            console.log(
                                `Received: NONCE_ALLOWED from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            this.targetNonce = sessionMsg.getBody().getItem();
                            this.socket.close();
                            break;
                        }
                        case MessageType.NONCE_DENIED: {
                            console.log(
                                `Received: NONCE_DENIED from ${rinfo.address}:${
                                    rinfo.port
                                }`
                            );
                            throw Error(sessionMsg.getBody().getItem());
                        }

                        default: {
                            throw Error(
                                "Got invalid session message while connecting"
                            );
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            });

            this.socket.bind(PORT);
        } catch (err) {
            console.error(err);
        }
    }

    listen(): void {
        try {
            console.log("Start listening");
            this.socket = DGRAM.createSocket("udp4");

            this.socket.on("error", (err: any) => {
                console.log(`server error:\n${err.stack}`);
                this.socket.close();
            });

            this.socket.on("listening", () => {
                this.socket.setRecvBufferSize(MAX_PACKET_SIZE);
                this.socket.setSendBufferSize(MAX_PACKET_SIZE);
                const address = this.socket.address();
                console.log(
                    "UDP Server listening on " +
                        address.address +
                        ":" +
                        address.port
                );
            });

            this.socket.on("message", async (msg: any, rinfo: any) => {
                try {
                    const sessionMsg = SessionMessage.fromBytes(msg);

                    switch (sessionMsg.getBody().protocolId()) {
                        case MessageType.NODE_ID_REQUEST: {
                            console.log(
                                `Received: NODE_ID_REQUEST from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            this.setIp(rinfo.address);
                            this.setPort(rinfo.port);
                            this.sendSessionMessage(
                                MessageType.NODE_ID_RESPONSE
                            );
                            break;
                        }

                        case MessageType.SECRET_REQUEST: {
                            console.log(
                                `Received: SECRET_REQUEST from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            this.targetPubkey = sessionMsg.getBody().getItem();
                            this.key = ec.genKeyPair();
                            this.sendSessionMessage(MessageType.SECRET_ALLOWED);
                            break;
                        }

                        case MessageType.NONCE_REQUEST: {
                            console.log(
                                `Received: NONCE_REQUEST from ${
                                    rinfo.address
                                }:${rinfo.port}`
                            );
                            if (this.targetPubkey === null) {
                                throw Error("The key is not defined");
                            }
                            const pubKey = ec
                                .keyFromPublic(
                                    "04".concat(
                                        this.targetPubkey
                                            .toEncodeObject()
                                            .slice(2)
                                    ),
                                    "hex"
                                )
                                .getPublic();
                            const sharedSecret = this.key.derive(pubKey);
                            const encodedNonce = this.nonce.rlpBytes();

                            const iv = new Buffer(
                                "00000000000000000000000000000000",
                                "hex"
                            );
                            const key = new Buffer(
                                sharedSecret.toString(16),
                                "hex"
                            );
                            const encryptor = CRYPTO.createCipheriv(
                                ALGORITHM,
                                key,
                                iv
                            );

                            encryptor.write(encodedNonce);
                            encryptor.end();
                            this.encodedSecret = new Buffer(encryptor.read());
                            await this.sendSessionMessage(
                                MessageType.NONCE_ALLOWED
                            );
                            this.socket.close();
                            break;
                        }

                        default: {
                            throw Error(
                                "Got invalid session message while listening"
                            );
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            });

            this.socket.bind(PORT + 1);
        } catch (err) {
            console.error(err);
        }
    }

    private async sendSessionMessage(messageType: MessageType): Promise<void> {
        switch (messageType) {
            case MessageType.NODE_ID_REQUEST: {
                console.log("Send NODE_ID_REQUEST");
                const message = new SessionMessage(
                    0,
                    0,
                    new NodeIdRequest(
                        new NodeId(this.targetIp, this.targetPort)
                    )
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.NODE_ID_RESPONSE: {
                console.log("Send NODE_ID_RESPONSE");
                const message = new SessionMessage(
                    0,
                    0,
                    new NodeIdResponse(
                        new NodeId(this.targetIp, this.targetPort)
                    )
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.SECRET_REQUEST: {
                console.log("Send SECRET_REQUESTE");
                if (this.key === null) {
                    throw Error("The key is not defined");
                }
                const message = new SessionMessage(
                    0,
                    0,
                    new SecretRequest(
                        new H512(
                            this.key
                                .getPublic()
                                .encode("hex")
                                .slice(2, 130)
                        )
                    )
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.SECRET_ALLOWED: {
                console.log("Send SECRET_ALLOWED");
                if (this.key === null) {
                    throw Error("Secret key is not defined");
                }
                const message = new SessionMessage(
                    0,
                    0,
                    new SecretAllowed(
                        new H512(
                            this.key
                                .getPublic()
                                .encode("hex")
                                .slice(2, 130)
                        )
                    )
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.SECRET_DENIED: {
                console.log("Send SECRET_DENIED");
                const message = new SessionMessage(
                    0,
                    0,
                    new SecretDenied("Secret key request is denied")
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.NONCE_REQUEST: {
                console.log("Send NONCE_REQUEST");
                if (this.encodedSecret === null) {
                    throw Error("Secret is not maded");
                }
                const message = new SessionMessage(
                    0,
                    0,
                    new NonceRequest(this.encodedSecret)
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.NONCE_ALLOWED: {
                console.log("Send NONCE_ALLOWED");
                if (this.encodedSecret === null) {
                    throw Error("Secret is not maded");
                }
                const message = new SessionMessage(
                    0,
                    0,
                    new NonceAllowed(this.encodedSecret)
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
            case MessageType.NONCE_DENIED: {
                console.log("Send NONCE_DENIED");
                const message = new SessionMessage(
                    0,
                    0,
                    new NonceDenied("Nonce request is denied")
                );
                await this.socket.send(
                    message.rlpBytes(),
                    this.targetPort,
                    this.targetIp
                );
                break;
            }
        }
    }
}
