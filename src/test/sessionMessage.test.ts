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
        const msg = new sessionMessage.SessionMessage(0, body);
        expect([...msg.rlpBytes()]).toEqual([
            212,
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

    test("SecretRequest RLP encoding test", () => {
        const body = new sessionMessage.SecretRequest(
            new H512(
                "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000DEADBEEF"
            )
        );
        const msg = new sessionMessage.SessionMessage(0, body);
        expect([...msg.rlpBytes()]).toEqual([
            248,
            68,
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
