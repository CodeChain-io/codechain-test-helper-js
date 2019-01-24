import * as p2pMessage from "../p2pMessage";
import { U128, U256, H256 } from "codechain-primitives";

import "jest";

describe("Check P2P Message RLP encoding", () => {
    test("SyncMessage RLP encoding test", () => {
        const port = 1234;
        const msg = new p2pMessage.HandshakeMessage({
            type: "sync",
            version: new U256(0),
            port
        });
        expect([...msg.rlpBytes()]).toEqual([197, 128, 128, 130, 4, 210]);
    }, 10000);

    test("AckMessage RLP encoding test", () => {
        const msg = new p2pMessage.HandshakeMessage({
            type: "ack",
            version: new U256(0)
        });
        expect([...msg.rlpBytes()]).toEqual([194, 128, 1]);
    });

    test("RequestMessage RLP encoding test", () => {
        const msg = new p2pMessage.NegotiationMessage(
            new U256(0),
            new U256(0x5432),
            {
                type: "request",
                extensionName: "some-extension",
                extensionVersion: [new U256(1), new U256(2), new U256(3)]
            }
        );
        expect([...msg.rlpBytes()]).toEqual([
            216,
            128,
            2,
            130,
            84,
            50,
            142,
            115,
            111,
            109,
            101,
            45,
            101,
            120,
            116,
            101,
            110,
            115,
            105,
            111,
            110,
            195,
            1,
            2,
            3
        ]);
    });

    test("AllowedMessage RLP encoding test", () => {
        const msg = new p2pMessage.NegotiationMessage(
            new U256(0),
            new U256(0x716216a8b1),
            {
                type: "allowed",
                version: new U256(2)
            }
        );
        expect([...msg.rlpBytes()]).toEqual([
            201,
            128,
            3,
            133,
            113,
            98,
            22,
            168,
            177,
            2
        ]);
    });

    test("DeniedMessage RLP encoding test", () => {
        const msg = new p2pMessage.NegotiationMessage(
            new U256(0),
            new U256(0x3712),
            {
                type: "denied"
            }
        );
        expect([...msg.rlpBytes()]).toEqual([197, 128, 4, 130, 55, 18]);
    });

    test("EncryptedMessage RLP encoding test", () => {
        const extensionName = "encrypt";
        const extensionVersion = new U256(3);
        const data = "this data must be encrypted";
        const msg = new p2pMessage.ExtensionMessage(
            new U256(0),
            extensionName,
            extensionVersion,
            { type: "encrypted", data: Buffer.from(data) },
            new H256(
                "0x448c7925c992f86cb4b890bea81f18818aef8ec35189e00fdf7b5e41e90a4c1b"
            ),
            new U128("0x6d21cfc0a73acea109f24bb408b4b676")
        );
        expect([...msg.rlpBytes()]).toEqual([
            236,
            128,
            5,
            135,
            101,
            110,
            99,
            114,
            121,
            112,
            116,
            3,
            160,
            178,
            137,
            222,
            48,
            240,
            103,
            231,
            7,
            162,
            106,
            58,
            119,
            41,
            5,
            156,
            151,
            207,
            46,
            78,
            135,
            218,
            69,
            182,
            119,
            60,
            68,
            199,
            76,
            216,
            177,
            205,
            105
        ]);
    });

    test("UnencryptedMessage RLP encoding test", () => {
        const extensionName = "unencrypt";
        const extensionVersion = new U256(3);
        const data = "this data must be encrypted";
        const msg = new p2pMessage.ExtensionMessage(
            new U256(0),
            extensionName,
            extensionVersion,
            { type: "unencrypted", data: Buffer.from(data) },
            new H256(
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            ),
            new U128("0x00000000000000000000000000000000")
        );
        expect([...msg.rlpBytes()]).toEqual([
            233,
            128,
            6,
            137,
            117,
            110,
            101,
            110,
            99,
            114,
            121,
            112,
            116,
            3,
            155,
            116,
            104,
            105,
            115,
            32,
            100,
            97,
            116,
            97,
            32,
            109,
            117,
            115,
            116,
            32,
            98,
            101,
            32,
            101,
            110,
            99,
            114,
            121,
            112,
            116,
            101,
            100
        ]);
    });

    test("SignedMessage RLP encoding test", () => {
        const port = 1234;
        const msg = new p2pMessage.HandshakeMessage({
            type: "sync",
            version: new U256(0),
            port
        });
        const signedmsg = new p2pMessage.SignedMessage(
            msg,
            new U128("0x00000000000000000000000000000000")
        );
        expect([...signedmsg.rlpBytes()]).toEqual([
            232,
            134,
            197,
            128,
            128,
            130,
            4,
            210,
            160,
            115,
            78,
            6,
            129,
            102,
            216,
            22,
            227,
            53,
            80,
            86,
            35,
            194,
            162,
            107,
            233,
            138,
            55,
            27,
            166,
            193,
            147,
            139,
            14,
            77,
            131,
            193,
            15,
            152,
            19,
            253,
            64
        ]);
    });
});
