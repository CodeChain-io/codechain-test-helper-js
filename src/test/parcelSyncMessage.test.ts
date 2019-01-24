import * as ParcelSyncMessage from "../parcelSyncMessage";

import "jest";

describe("Check ParcelSyncMessage RLP encoding", () => {
    test("ParcelSyncMessage RLP encoding test", () => {
        const msg = new ParcelSyncMessage.ParcelSyncMessage({
            type: "parcels",
            data: []
        });
        expect([...msg.rlpBytes()]).toEqual([192]);
    }, 10000);
});
