"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const codechain_primitives_1 = require("codechain-primitives");
const sessionMessage_1 = require("./sessionMessage");
const CRYPTO = require("crypto");
const ALGORITHM = "AES-256-CBC";
const DGRAM = require("dgram");
const EC = require("elliptic").ec;
const RLP = require("rlp");
const MAX_PACKET_SIZE = 1024;
exports.PORT = 6602;
const ec = new EC("secp256k1");
class Session {
    constructor(ip, port) {
        this.targetIp = ip;
        this.targetPort = port;
        this.key = null;
        this.nonce = new codechain_primitives_1.U128("0x000000000000000000000000DEADBEEF");
        this.secret = null;
        this.targetNonce = new codechain_primitives_1.U128("0x00000000000000000000000000000000");
        this.targetPubkey = null;
        this.encodedSecret = null;
        this.log = false;
        this.port = exports.PORT + Session.idCounter++;
    }
    setLog() {
        this.log = true;
    }
    setKey(key) {
        this.key = key;
    }
    setNonce(nonce) {
        this.nonce = nonce;
    }
    setTargetNonce(nonce) {
        this.targetNonce = nonce;
    }
    setTargetPubkey(pub) {
        this.targetPubkey = pub;
    }
    getPort() {
        return this.port;
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
    getSocket() {
        return this.socket;
    }
    getSecret() {
        return this.secret;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            if (this.log)
                console.log("Start connecting");
            try {
                this.socket = DGRAM.createSocket("udp4");
                this.socket.on("error", (err) => {
                    if (this.log)
                        console.log(`server error:\n${err.stack}`);
                    this.socket.close();
                    reject(err);
                });
                this.socket.on("listening", () => {
                    this.socket.setRecvBufferSize(MAX_PACKET_SIZE);
                    this.socket.setSendBufferSize(MAX_PACKET_SIZE);
                    const address = this.socket.address();
                    if (this.log)
                        console.log("UDP Server listening on " +
                            address.address +
                            ":" +
                            address.port);
                    try {
                        this.sendSessionMessage(sessionMessage_1.MessageType.NODE_ID_REQUEST);
                    }
                    catch (err) {
                        console.error(err);
                        reject(err);
                    }
                });
                this.socket.on("message", (msg, rinfo) => {
                    if (this.onConnectionMessage(msg, rinfo)) {
                        resolve();
                    }
                });
                this.socket.bind(this.port);
            }
            catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }
    async listen() {
        return new Promise((resolve, reject) => {
            if (this.log)
                console.log("Start listening");
            try {
                this.socket = DGRAM.createSocket("udp4");
                this.socket.on("error", (err) => {
                    if (this.log)
                        console.log(`server error:\n${err.stack}`);
                    this.socket.close();
                    reject(err);
                });
                this.socket.on("listening", () => {
                    this.socket.setRecvBufferSize(MAX_PACKET_SIZE);
                    this.socket.setSendBufferSize(MAX_PACKET_SIZE);
                    const address = this.socket.address();
                    if (this.log)
                        console.log("UDP Server listening on " +
                            address.address +
                            ":" +
                            address.port);
                });
                this.socket.on("message", async (msg, rinfo) => {
                    if (this.onLiteningMessage(msg, rinfo)) {
                        resolve();
                    }
                });
                this.socket.bind(this.port + 1);
            }
            catch (err) {
                console.error(err);
                reject();
            }
        });
    }
    onConnectionMessage(msg, rinfo) {
        try {
            const sessionMsg = sessionMessage_1.SessionMessage.fromBytes(msg);
            switch (sessionMsg.getBody().protocolId()) {
                case sessionMessage_1.MessageType.NODE_ID_RESPONSE: {
                    if (this.log)
                        console.log(`Received: NODE_ID_RESPONSE from ${rinfo.address}:${rinfo.port}`);
                    this.key = ec.genKeyPair();
                    this.sendSessionMessage(sessionMessage_1.MessageType.SECRET_REQUEST);
                    break;
                }
                case sessionMessage_1.MessageType.SECRET_ALLOWED: {
                    if (this.log)
                        console.log(`Received: SECRET_ALLOWED from ${rinfo.address}:${rinfo.port}`);
                    this.targetPubkey = sessionMsg.getBody().getItem();
                    if (this.targetPubkey == null) {
                        throw Error("The key is not defined");
                    }
                    const pubKey = ec
                        .keyFromPublic("04".concat(this.targetPubkey.toEncodeObject().slice(2)), "hex")
                        .getPublic();
                    this.secret = new codechain_primitives_1.H256(this.key
                        .derive(pubKey)
                        .toString(16)
                        .padStart(64, "0"));
                    const encodedNonce = this.nonce.rlpBytes();
                    const iv = Buffer.from("00000000000000000000000000000000", "hex");
                    if (this.secret == null) {
                        throw Error("Failed to get shared secret");
                    }
                    const key = Buffer.from(this.secret.toEncodeObject().slice(2), "hex");
                    const encryptor = CRYPTO.createCipheriv(ALGORITHM, key, iv);
                    encryptor.write(encodedNonce);
                    encryptor.end();
                    this.encodedSecret = Buffer.from(encryptor.read());
                    this.sendSessionMessage(sessionMessage_1.MessageType.NONCE_REQUEST);
                    break;
                }
                case sessionMessage_1.MessageType.SECRET_DENIED: {
                    if (this.log)
                        console.log(`Received: SECRET_DENIED from ${rinfo.address}:${rinfo.port}`);
                    this.socket.close();
                    throw Error(sessionMsg.getBody().getItem());
                }
                case sessionMessage_1.MessageType.NONCE_ALLOWED: {
                    if (this.log)
                        console.log(`Received: NONCE_ALLOWED from ${rinfo.address}:${rinfo.port}`);
                    const iv = Buffer.from(this.nonce.toString(16).padStart(32, "0"), "hex");
                    if (this.secret == null) {
                        throw Error("Failed to get shared secret");
                    }
                    const key = Buffer.from(this.secret.toEncodeObject().slice(2), "hex");
                    const decryptor = CRYPTO.createDecipheriv(ALGORITHM, key, iv);
                    decryptor.write(sessionMsg.getBody().getItem());
                    decryptor.end();
                    this.targetNonce = new codechain_primitives_1.U128(`0x${RLP.decode(decryptor.read()).toString("hex")}`);
                    this.socket.close();
                    return true;
                }
                case sessionMessage_1.MessageType.NONCE_DENIED: {
                    if (this.log)
                        console.log(`Received: NONCE_DENIED from ${rinfo.address}:${rinfo.port}`);
                    this.socket.close();
                    throw Error(sessionMsg.getBody().getItem());
                }
                default: {
                    throw Error("Got invalid session message while connecting");
                }
            }
            return false;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    onLiteningMessage(msg, rinfo) {
        try {
            const sessionMsg = sessionMessage_1.SessionMessage.fromBytes(msg);
            switch (sessionMsg.getBody().protocolId()) {
                case sessionMessage_1.MessageType.NODE_ID_REQUEST: {
                    if (this.log)
                        console.log(`Received: NODE_ID_REQUEST from ${rinfo.address}:${rinfo.port}`);
                    this.sendSessionMessage(sessionMessage_1.MessageType.NODE_ID_RESPONSE);
                    break;
                }
                case sessionMessage_1.MessageType.SECRET_REQUEST: {
                    if (this.log)
                        console.log(`Received: SECRET_REQUEST from ${rinfo.address}:${rinfo.port}`);
                    this.targetPubkey = sessionMsg.getBody().getItem();
                    this.key = ec.genKeyPair();
                    this.sendSessionMessage(sessionMessage_1.MessageType.SECRET_ALLOWED);
                    break;
                }
                case sessionMessage_1.MessageType.NONCE_REQUEST: {
                    if (this.log)
                        console.log(`Received: NONCE_REQUEST from ${rinfo.address}:${rinfo.port}`);
                    if (this.targetPubkey == null) {
                        throw Error("The key is not defined");
                    }
                    const pubKey = ec
                        .keyFromPublic("04".concat(this.targetPubkey.toEncodeObject().slice(2)), "hex")
                        .getPublic();
                    this.secret = new codechain_primitives_1.H256(this.key.derive(pubKey).toString(16));
                    const ivd = Buffer.from("00000000000000000000000000000000", "hex");
                    if (this.secret == null) {
                        throw Error("Failed to get shared secret");
                    }
                    const key = Buffer.from(this.secret.toEncodeObject().slice(2), "hex");
                    const decryptor = CRYPTO.createDecipheriv(ALGORITHM, key, ivd);
                    decryptor.write(sessionMsg.getBody().getItem());
                    decryptor.end();
                    this.targetNonce = new codechain_primitives_1.U128(`0x${RLP.decode(decryptor.read()).toString("hex")}`);
                    const encodedNonce = this.nonce.rlpBytes();
                    const ive = Buffer.from(this.targetNonce.toString(16).padStart(32, "0"), "hex");
                    const encryptor = CRYPTO.createCipheriv(ALGORITHM, key, ive);
                    encryptor.write(encodedNonce);
                    encryptor.end();
                    this.encodedSecret = Buffer.from(encryptor.read());
                    this.sendSessionMessage(sessionMessage_1.MessageType.NONCE_ALLOWED);
                    this.socket.close();
                    break;
                }
                default: {
                    throw Error("Got invalid session message while listening");
                }
            }
            return false;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async sendSessionMessage(messageType) {
        switch (messageType) {
            case sessionMessage_1.MessageType.NODE_ID_REQUEST: {
                if (this.log)
                    console.log("Send NODE_ID_REQUEST");
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.NodeIdRequest(new sessionMessage_1.NodeId(this.targetIp, this.targetPort)));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.NODE_ID_RESPONSE: {
                if (this.log)
                    console.log("Send NODE_ID_RESPONSE");
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.NodeIdResponse(new sessionMessage_1.NodeId(this.targetIp, this.targetPort)));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.SECRET_REQUEST: {
                if (this.log)
                    console.log("Send SECRET_REQUESTE");
                if (this.key == null) {
                    throw Error("The key is not defined");
                }
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.SecretRequest(new codechain_primitives_1.H512(this.key
                    .getPublic()
                    .encode("hex")
                    .slice(2, 130))));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.SECRET_ALLOWED: {
                if (this.log)
                    console.log("Send SECRET_ALLOWED");
                if (this.key == null) {
                    throw Error("Secret key is not defined");
                }
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.SecretAllowed(new codechain_primitives_1.H512(this.key
                    .getPublic()
                    .encode("hex")
                    .slice(2, 130))));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.SECRET_DENIED: {
                if (this.log)
                    console.log("Send SECRET_DENIED");
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.SecretDenied("Secret key request is denied"));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.NONCE_REQUEST: {
                if (this.log)
                    console.log("Send NONCE_REQUEST");
                if (this.encodedSecret == null) {
                    throw Error("Secret is not maded");
                }
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.NonceRequest(this.encodedSecret));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.NONCE_ALLOWED: {
                if (this.log)
                    console.log("Send NONCE_ALLOWED");
                if (this.encodedSecret == null) {
                    throw Error("Secret is not maded");
                }
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.NonceAllowed(this.encodedSecret));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
            case sessionMessage_1.MessageType.NONCE_DENIED: {
                if (this.log)
                    console.log("Send NONCE_DENIED");
                const message = new sessionMessage_1.SessionMessage(0, new codechain_primitives_1.U256(0), new sessionMessage_1.NonceDenied("Nonce request is denied"));
                await this.socket.send(message.rlpBytes(), this.targetPort, this.targetIp);
                break;
            }
        }
    }
}
Session.idCounter = 0;
exports.Session = Session;
