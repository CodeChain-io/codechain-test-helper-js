import * as sessionMessage from "../sessionMessage";
import { H128 } from "codechain-sdk/lib/core/H128";
import { H512 } from "codechain-sdk/lib/core/H512";

describe("Check RLP encoding", () => {
    test(
        "NodeIdRequest RLP encoding test",
        () => {
            const body = new sessionMessage.NodeIdRequest({
                ip: "80.80.80.80",
                port: 8080
            });
            const msg = new sessionMessage.SessionMessage(0, 0x8a, body);
            expect([...msg.rlpBytes()]).toEqual([
                204,
                128,
                129,
                138,
                1,
                199,
                80,
                80,
                80,
                80,
                130,
                31,
                144
            ]);
        },
        10000
    );

    test(
        "NodeIdResponse RLP encoding test",
        () => {
            const body = new sessionMessage.NodeIdResponse({
                ip: "80.80.80.80",
                port: 8080
            });
            const msg = new sessionMessage.SessionMessage(0, 0x9a, body);
            expect([...msg.rlpBytes()]).toEqual([
                204,
                128,
                129,
                154,
                2,
                199,
                80,
                80,
                80,
                80,
                130,
                31,
                144
            ]);
        },
        10000
    );

    test(
        "NonceRequest RLP encoding test",
        () => {
            const body = new sessionMessage.NonceRequest(
                new H128("0x000000000000000000000000DEADBEEF")
            );
            const msg = new sessionMessage.SessionMessage(0, 0, body);
            expect([...msg.rlpBytes()]).toEqual([
                213,
                128,
                128,
                6,
                145,
                144,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                222,
                173,
                190,
                239
            ]);
        },
        10000
    );

    test(
        "NonceDenied RLP encoding test",
        () => {
            const body = new sessionMessage.NonceDenied("connection denied");
            const msg = new sessionMessage.SessionMessage(0, 6, body);
            expect([...msg.rlpBytes()]).toEqual([
                213,
                128,
                6,
                8,
                145,
                99,
                111,
                110,
                110,
                101,
                99,
                116,
                105,
                111,
                110,
                32,
                100,
                101,
                110,
                105,
                101,
                100
            ]);
        },
        10000
    );

    test(
        "SecretRequest RLP encoding test",
        () => {
            const body = new sessionMessage.SecretRequest(
                new H512(
                    "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000DEADBEEF"
                )
            );
            const msg = new sessionMessage.SessionMessage(0, 0, body);
            expect([...msg.rlpBytes()]).toEqual([
                248,
                69,
                128,
                128,
                3,
                184,
                64,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                222,
                173,
                190,
                239
            ]);
        },
        10000
    );
});
