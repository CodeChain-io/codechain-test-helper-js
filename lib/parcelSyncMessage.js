"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright 2018 Kodebox, Inc.
// This file is part of CodeChain.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
const RLP = require("rlp");
class ParcelSyncMessage {
    constructor(body) {
        this.body = body;
    }
    getBody() {
        return this.body;
    }
    toEncodeObject() {
        return this.body.data;
    }
    rlpBytes() {
        return RLP.encode(this.toEncodeObject());
    }
    static fromBytes(bytes) {
        const decodedmsg = RLP.decode(bytes);
        return new ParcelSyncMessage({ type: "parcels", data: decodedmsg });
    }
}
exports.ParcelSyncMessage = ParcelSyncMessage;
