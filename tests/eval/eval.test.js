"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common = require("../common");
test('Eval', () => __awaiter(void 0, void 0, void 0, function* () {
    common.writeHTML('index.html', common.html `<h1>{{ let a = 10; let b = 20; a + b }}</h1>`);
    yield common.runJSDOM();
    expect(common.getDocument().querySelector('h1').innerHTML).toEqual('30');
}));
