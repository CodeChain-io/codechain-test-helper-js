import * as ParcelSyncMessage from "../transactionSyncMessage";
import "jest";

describe("Check TransactionSyncMessage RLP encoding", () => {
    test("TransactionSyncMessage RLP encoding test", () => {
        const msg = new ParcelSyncMessage.TransactionSyncMessage({
            type: "transactions",
            data: []
        });
        expect([...msg.rlpBytes()]).toEqual([192]);
    }, 10000);
});
