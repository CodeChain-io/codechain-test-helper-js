import * as sessionMessage from "../sessionMessage";
import { H128 } from "codechain-primitives";
import { H512 } from "codechain-primitives";
import { U256 } from "codechain-primitives";

import "jest";

describe("Check Session Message RLP encoding", () => {
    test("NonceRequest RLP encoding test", () => {
        const body = new sessionMessage.NonceRequest(
            new H128("0x000000000000000000000000DEADBEEF").rlpBytes()
        );
        const msg = new sessionMessage.SessionMessage(0, new U256(0), body);
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
    }, 10000);

    test("NonceDenied RLP encoding test", () => {
        const body = new sessionMessage.NonceDenied("connection denied");
        const msg = new sessionMessage.SessionMessage(0, new U256(6), body);
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
    }, 10000);

    test("SecretRequest RLP encoding test", () => {
        const body = new sessionMessage.SecretRequest(
            new H512(
                "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000DEADBEEF"
            )
        );
        const msg = new sessionMessage.SessionMessage(0, new U256(0), body);
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
    }, 10000);
});
