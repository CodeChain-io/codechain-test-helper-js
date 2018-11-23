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
function sendBlock() {
    return __awaiter(this, void 0, void 0, function* () {
        const TH = new testHelper_1.TestHelper("0.0.0.0", 3485);
        TH.setLog();
        yield TH.establish();
        // Genesis block
        const header = TH.soloGenesisBlockHeader();
        // Block 1
        const header1 = TH.soloBlock1(header.hashing());
        // Block 2
        const header2 = TH.soloBlock2(header1.hashing());
        yield TH.sendEncodedBlock([
            header.toEncodeObject(),
            header1.toEncodeObject(),
            header2.toEncodeObject()
        ], [[], []], header2.hashing(), header2.getScore());
        yield TH.end();
    });
}
sendBlock();
