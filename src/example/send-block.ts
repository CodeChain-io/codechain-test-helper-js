import { TestHelper } from "../testHelper";
import { Header } from "../cHeader";
import { H256 } from "codechain-sdk/lib/core/H256";
import { H160 } from "codechain-sdk/lib/core/H160";
import { U256 } from "codechain-sdk/lib/core/U256";

async function sendBlock() {
    const TH = new TestHelper("0.0.0.0", 3485);
    await TH.establish();

    // Genesis block
    const parentHash = new H256(
        "0000000000000000000000000000000000000000000000000000000000000000"
    );
    const timestamp = 0;
    const number = 0;
    const author = new H160("0000000000000000000000000000000000000000");
    const extraData = Buffer.from([
        23,
        108,
        91,
        111,
        253,
        100,
        40,
        143,
        87,
        206,
        189,
        160,
        126,
        135,
        186,
        91,
        4,
        70,
        5,
        195,
        246,
        153,
        51,
        67,
        233,
        113,
        143,
        161,
        0,
        209,
        115,
        124
    ]);
    const parcelsRoot = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const stateRoot = new H256(
        "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
    );
    const invoicesRoot = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const score = new U256(131072);
    const seal: any[] = [];
    const hash = new H256(
        "ff8324bd3b0232e4fd1799496ae422ee0896cc7a8a64a2885052e320b4ba9535"
    );
    const header = new Header(
        parentHash,
        timestamp,
        number,
        author,
        extraData,
        parcelsRoot,
        stateRoot,
        invoicesRoot,
        score,
        seal
    );

    // Block 1
    const parentHash1 = hash;
    const timestamp1 = 1537509963;
    const number1 = 1;
    const author1 = new H160("7777777777777777777777777777777777777777");
    const extraData1 = Buffer.alloc(0);
    const parcelsRoot1 = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const stateRoot1 = new H256(
        "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
    );
    const invoicesRoot1 = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const score1 = new U256(999999999999999);
    const seal1: any[] = [];
    const header1 = new Header(
        parentHash1,
        timestamp1,
        number1,
        author1,
        extraData1,
        parcelsRoot1,
        stateRoot1,
        invoicesRoot1,
        score1,
        seal1
    );
    const hash1 = header1.hashing();

    // Block 2
    const parentHash2 = hash1;
    const timestamp2 = 1537944287;
    const number2 = 2;
    const author2 = new H160("6666666666666666666666666666666666666666");
    const extraData2 = Buffer.alloc(0);
    const parcelsRoot2 = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const stateRoot2 = new H256(
        "2f6b19afc38f6f1464af20dde08d8bebd6a6aec0a95aaf7ef2fb729c3b88dc5b"
    );
    const invoicesRoot2 = new H256(
        "45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
    );
    const score2 = new U256(999999999999999);
    const seal2: any[] = [];
    const header2 = new Header(
        parentHash2,
        timestamp2,
        number2,
        author2,
        extraData2,
        parcelsRoot2,
        stateRoot2,
        invoicesRoot2,
        score2,
        seal2
    );
    const hash2 = header2.hashing();

    await TH.sendEncodedBlock(
        [
            header.toEncodeObject(),
            header1.toEncodeObject(),
            header2.toEncodeObject()
        ],
        [[], []],
        hash2,
        score2
    );
}

sendBlock();
