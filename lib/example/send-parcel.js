"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const testHelper_1 = require("../testHelper");
const SDK = require("codechain-sdk");
function sendParcel() {
    return __awaiter(this, void 0, void 0, function* () {
        const TH = new testHelper_1.TestHelper("0.0.0.0", 3485);
        TH.setLog();
        yield TH.establish();
        const sdk = new SDK({
            server: process.env.CODECHAIN_RPC_HTTP || "http://localhost:8080",
            networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
        });
        const ACCOUNT_SECRET = process.env.ACCOUNT_SECRET ||
            "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
        const parcel = sdk.core.createPaymentParcel({
            recipient: "tccqruq09sfgax77nj4gukjcuq69uzeyv0jcs7vzngg",
            amount: 10000
        });
        const signedparcel = parcel.sign({
            secret: ACCOUNT_SECRET,
            fee: 10,
            nonce: 0
        });
        yield TH.sendEncodedParcel([signedparcel.toEncodeObject()]);
        yield TH.end();
    });
}
sendParcel();
