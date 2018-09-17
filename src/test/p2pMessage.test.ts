import * as p2pMessage from "../p2pMessage";
import * as sessionMessage from "../sessionMessage";
import { H128 } from "codechain-sdk/lib/core/H128";

describe("Check P2P Message RLP encoding", () => {
    test(
        "SyncMessage RLP encoding test",
        () => {
            const port = 1234;
            const nodeid = new sessionMessage.NodeId("127.0.0.1", 8080);
            const body = new p2pMessage.SyncMessage(0, port, nodeid);
            const msg = new p2pMessage.HandshakeMessage(body);
            expect([...msg.rlpBytes()]).toEqual([
                205,
                128,
                128,
                130,
                4,
                210,
                199,
                127,
                128,
                128,
                1,
                130,
                31,
                144
            ]);
        },
        10000
    );

    test("AckMessage RLP encoding test", () => {
        const body = new p2pMessage.AckMessage(0);
        const msg = new p2pMessage.HandshakeMessage(body);
        expect([...msg.rlpBytes()]).toEqual([194, 128, 1]);
    });

    test("RequestMessage RLP encoding test", () => {
        const msg = new p2pMessage.NegotiationMessage(0, 0x5432, {
            type: "request",
            extensionName: "some-extension",
            extensionVersion: [1, 2, 3]
        });
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
        const msg = new p2pMessage.NegotiationMessage(0, 0x716216a8b1, {
            type: "allowed",
            version: 2
        });
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
        const msg = new p2pMessage.NegotiationMessage(0, 0x3712, {
            type: "denied"
        });
        expect([...msg.rlpBytes()]).toEqual([197, 128, 4, 130, 55, 18]);
    });

    test("EncryptedMessage RLP encoding test", () => {
        const extensionName = "encrypt";
        const extensionVersion = 3;
        const data = "this data must be encrypted";
        const msg = new p2pMessage.ExtensionMessage(
            0,
            extensionName,
            extensionVersion,
            { type: "encrypted", data: new Buffer(data) }
        );
        expect([...msg.rlpBytes()]).toEqual([
            231,
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

    test("UnencryptedMessage RLP encoding test", () => {
        const extensionName = "unencrypt";
        const extensionVersion = 3;
        const data = "this data must be encrypted";
        const msg = new p2pMessage.ExtensionMessage(
            0,
            extensionName,
            extensionVersion,
            { type: "unencrypted", data: new Buffer(data) }
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
        const nodeid = new sessionMessage.NodeId("127.0.0.1", 8080);
        const body = new p2pMessage.SyncMessage(0, port, nodeid);
        const msg = new p2pMessage.HandshakeMessage(body);
        const signedmsg = new p2pMessage.SignedMessage(
            msg,
            new H128("00000000000000000000000000000000")
        );
        expect([...signedmsg.rlpBytes()]).toEqual([
            240,
            142,
            205,
            128,
            128,
            130,
            4,
            210,
            199,
            127,
            128,
            128,
            1,
            130,
            31,
            144,
            160,
            175,
            189,
            253,
            75,
            254,
            164,
            207,
            23,
            42,
            187,
            234,
            244,
            45,
            212,
            131,
            50,
            11,
            132,
            161,
            87,
            90,
            126,
            203,
            191,
            83,
            115,
            223,
            38,
            254,
            181,
            147,
            181
        ]);
    });
});
