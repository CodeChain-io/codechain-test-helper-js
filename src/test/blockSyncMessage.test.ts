import * as BlockSyncMessage from "../blockSyncMessage";
import { U256 } from "codechain-primitives";

describe("Check BlockSyncMessage RLP encoding", () => {
    test(
        "RequestBodyMessage RLP encoding test",
        () => {
            const message = new BlockSyncMessage.RequestMessage({
                type: "bodies",
                data: []
            });
            const msg = new BlockSyncMessage.BlockSyncMessage({
                type: "request",
                id: new U256(10),
                message
            });
            expect([...msg.rlpBytes()]).toEqual([195, 4, 10, 192]);
        },
        10000
    );

    test(
        "ResponseBodyMessage RLP encoding test",
        () => {
            const message = new BlockSyncMessage.ResponseMessage({
                type: "bodies",
                data: [[]]
            });
            const msg = new BlockSyncMessage.BlockSyncMessage({
                type: "response",
                id: new U256(10),
                message
            });
            expect([...msg.rlpBytes()]).toEqual([196, 5, 10, 193, 192]);
        },
        10000
    );
});
