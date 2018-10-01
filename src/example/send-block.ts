import { TestHelper } from "../testHelper";

async function sendBlock() {
    const TH = new TestHelper("0.0.0.0", 3485);
    TH.setLog();
    await TH.establish();
    // Genesis block
    const header = TH.soloGenesisBlockHeader();

    // Block 1
    const header1 = TH.soloBlock1(header.hashing());

    // Block 2
    const header2 = TH.soloBlock2(header1.hashing());

    await TH.sendEncodedBlock(
        [
            header.toEncodeObject(),
            header1.toEncodeObject(),
            header2.toEncodeObject()
        ],
        [[], []],
        header2.hashing(),
        header2.getScore()
    );

    await TH.end();
}

sendBlock();
