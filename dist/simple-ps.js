/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SimplePS"] = factory();
	else
		root["SimplePS"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Engine: () => (/* reexport safe */ _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Engine)\n/* harmony export */ });\n/* harmony import */ var _simple_ps__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simple-ps */ \"./src/simple-ps.js\");\n\n\n\n\n\n//# sourceURL=webpack://SimplePS/./src/index.js?");

/***/ }),

/***/ "./src/parser.js":
/*!***********************!*\
  !*** ./src/parser.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   rules: () => (/* binding */ rules)\n/* harmony export */ });\n/* harmony import */ var _simple_ps__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simple-ps */ \"./src/simple-ps.js\");\n/*\n * 文字列を受け取りRuleの配列を返すパーサであるrules()関数を提供。\n * もしエラーがあったらエラーメッセージの文字列を返す。\n */\n\n\n// 識別子の最初の文字にマッチする正規表現\nconst rx_id1st = new RegExp('[a-zA-Z_\\u00c0-\\u1fff\\u3040-\\u318f\\u3400-\\u3d2d\\u4e00-\\u9fff\\uf900-\\ufaff]');\n// 識別子の2文字目以降の文字にマッチする正規表現\nconst rx_id2nd = new RegExp('[a-zA-Z_\\u00c0-\\u1fff\\u3040-\\u318f\\u3400-\\u3d2d\\u4e00-\\u9fff\\uf900-\\ufaff0-9]');\n// 数字と判定される文字にマッチする正規表現\nconst rx_num = new RegExp('[0-9]');\n\n// 再帰下降構文解析で解析する。方針としてグローバル変数の\n// inputStrに解析文字列を入れといて、基本1文字ずつ解析。\n// その文字の位置を常にグローバル変数のidx変数に保存。\n// 解析関数はinputStr.charAt(idx)から\n// 解析を始める。その時に必要であれば解析が失敗することを\n// 考慮してidxをidxBackupに保存しておく。もし、解析が成功\n// したらidxは次に解析される文字の所まで進めておく義務がある。\n// なおかつreturnで解析結果を返す。もし、解析が失敗したら\n// エラーメッセージをグローバル変数のerrorMessageに書き込み、\n// バックアップしていたidxBackupをidxに代入して戻しておく。\n// なおかつreturnでnullを返すことにする。\n\nlet inputStr; // 解析する文字列(普通は\\nが入った複数行の文字列)\nlet idx; // 現在解析しているinputStr中の一文字の場所\nlet errorMessage; // エラーメッセージを記録しておく場所\n\n// 現在解析している場所の行番号と列番号を文字列で返す関数。\n// エラーメッセージ作る時に使おう。\nfunction lineColumnNo() {\n  let line = 1;\n  let column = 1;\n  for (let i=0;i<idx;i++) {\n    if (inputStr.charAt(i)==='\\n') {\n      line++;\n      column = 1;\n    } else {\n      column++;\n    }\n  }\n  return \"\"+line+\":\"+column;\n}\n\n// 指定した1文字を検出する解析関数\nfunction char(c) {\n  if (inputStr.charAt(idx)===c) {\n    idx++;\n    return c;\n  }\n  errorMessage = `Error(${lineColumnNo()}) ここには文字「${c}」がこなければなりません。`;\n  return null;\n}\n\n// コメントは「/*」で始まり「*/」で終るコメントのみ許可\nfunction comment() {\n  const idxBackup = idx;\n  if (char('/')) {\n    if (char('*')) {\n      while (true) {\n\tconst idxBackup2 = idx;\n\tif (char('*')) {\n\t  if (char('/')) {\n\t    return \"comment\";\n\t  }\n\t}\n\tidx = idxBackup2;\n\tif (inputStr.charAt(idx)==='') {\n\t  idx = idxBackup;\n\t  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;\n\t  return null;\n\t}\n\tidx++;\n      }\n    }\n  }\n  idx = idxBackup;\n  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;\n  return null;\n}\n\n// 半角空白、タブ、改行の時成功。それ以外は失敗。\nfunction whiteChar() {\n  if (char(' ')) return ' ';\n  if (char('\\t')) return '\\t';\n  if (char('\\n')) return '\\n';\n  errorMessage = `Error(${lineColumnNo()})`;\n  return null;\n}\n\n// whiteSpaceまたは空文字列を検出。なので絶対成功する。\n// つまりスペースが入ってても良いし入ってなくても良い\n// ような場所で使う。あとコメント文もwhiteSpace扱いに\n// することにした。\nfunction whiteSpace() {\n  while (true) {\n    const cmt = comment();\n    if (cmt)\n      continue;\n    const w = whiteChar();\n    if (w == null)\n      return \"whiteSpace\";\n  }\n}\n\n// 関数名、変数名などの名前に相当する識別子を検出する\nfunction id() {\n  const idxBackup = idx;\n  let name = '';\n  let c = inputStr.charAt(idx);\n  if (!c.match(rx_id1st)) {\n    errorMessage = `Error(${lineColumnNo()}) ここには識別子がくるべきです。`;\n    return null;\n  }\n  name += c;\n  while (true) {\n    idx++;\n    c = inputStr.charAt(idx);\n    if (!c.match(rx_id2nd))\n      return name;\n    name += c;\n  }\n}\n\n// whiteSpaceを読み飛ばして入力文字列の終りを検出する\nfunction eof() {\n  const idxBackup = idx;\n  const w = whiteSpace(); // 絶対成功する\n  const c = inputStr.charAt(idx); // idxが範囲外の時は空文字列\n  if (c === '')\n    return \"EOF\";\n  // ここまで来たら何か文字が残ってるのでエラー\n  idx = idxBackup;\n  errorMessage = `Error(${lineColumnNo()}): EOF(入力の最後でなければなりません。`;\n  return null;\n}\n\n// 文字列を解析する。\n// まだ文字列中の引用符のエスケープとかには対応してない。\nfunction string() {\n  const idxBackup = idx;\n  let a = char('\"');\n  if (a==null)\n    a = char(\"'\");\n  if (a==null) {idx=idxBackup;return null;}\n  let s = '';\n  while (true) {\n    const c = inputStr.charAt(idx);\n    if (c === '') {\n      idx = idxBackup;\n      errorMessage = `Error(${lineColumnNo()}) 文字列解析中に入力が終了しました。`;\n      return null;\n    }\n    if (c === a) {\n      idx++;\n      break;\n    }\n    s += c;\n    idx++;\n  }\n  return s;\n}\n\n// 数字を解析する。\nfunction number() {\n  const idxBackup = idx;\n  let c = inputStr.charAt(idx);\n  if (c !== '.' && !c.match(rx_num)) {\n    errorMessage = `Error(${lineColumnNo()}) ここには数字がこなければなりません。`;\n    return null;\n  }\n  let num = '';\n  if (c === '.') { // '.'で始まる特殊な場合\n    idx++; c = inputStr.charAt(idx);\n    if (!c.match(rx_num)) {\n      idx = idxBackup;\n      return null;\n    }\n    idx = idxBackup;\n    c = inputStr.charAt(idx);\n  } else { // ここにくるのは整数部分\n    num += c;\n    idx++; c = inputStr.charAt(idx);\n    while (c.match(rx_num)) {\n      num += c;\n      idx++; c = inputStr.charAt(idx);\n    }\n  }\n  if (c === '.') { // 小数部分\n    num += c;\n    idx++; c = inputStr.charAt(idx);\n    while (c.match(rx_num)) {\n      num += c;\n      idx++; c = inputStr.charAt(idx);\n    }\n  }\n  if (c === 'e' || c === 'E') {\n    num += c;\n    idx++; c = inputStr.charAt(idx);\n    if (c === '+' || c === '-') {\n      num += c;\n      idx++; c = inputStr.charAt(idx);\n    }\n    while (c.match(rx_num)) {\n      num += c;\n      idx++; c = inputStr.charAt(idx);\n    }\n  }\n  return Number(num);\n}\n\n// 項(条件やビルトインなど)を解析。項は関数の形をしている。\nfunction term() {\n  const idxBackup = idx;\n  const fun = id();\n  if (fun == null) return null;\n    whiteSpace();\n  if (char('(') == null) {idx=idxBackup;return null};\n  const args = []; // 引数の配列\n  while (true) {\n    whiteSpace();\n    const v = id(); if (v) {args.push(new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Var(v));continue;} // 変数\n    const n = number(); if (n) {args.push(n);continue;} // 数字\n    const s = string(); if (s) {args.push(s);continue;} // 文字列\n\n    break;\n  }\n  if (char(')') == null) {idx=idxBackup;return null};\n  return new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Term(fun,args);\n}\n\n// ルール1本分。Ruleのインスタンスを返す。エラーならエラーメッセージを返す。\nfunction rule() {\n  const idxBackup = idx;\n  whiteSpace();\n  const priority = number();\n  if (priority == null) { idx=idxBackup; return null; }\n  whiteSpace();\n  if (char(':') == null) { idx=idxBackup; return null; }\n  const lhs = [];\n  while (true) {\n    whiteSpace();\n    const cond = term(); // 1つの条件に該当\n    if (cond == null) break;\n    lhs.push(cond);\n  }\n  if (lhs.length === 0) {\n    errorMessage = `Error(${lineColumnNo()}) 条件部(LHS)がありません。`;\n    idx=idxBackup;\n    return null;\n  }\n  whiteSpace();\n  if (char('-') == null) { idx=idxBackup; return null; }\n  if (char('>') == null) { idx=idxBackup; return null; }\n  const rhs = [];\n  while (true) {\n    whiteSpace();\n    const com = term(); // 1つの実行命令に該当\n    if (com == null) break;\n    rhs.push(com);\n  }\n  if (rhs.length === 0) {\n    errorMessage = `Error(${lineColumnNo()}) 実行部(RHS)がありません。`;\n    idx=idxBackup;\n    return null;\n  }\n  whiteSpace();\n  if (char(';') == null) { idx=idxBackup; return null; }\n  return new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Rule(priority,lhs,rhs);\n}\n\n// ルールの集合。ここが文法解析の出発点。解析するための\n// 文字列を引数で渡す。色々初期化してからスタート。\n// 解析が成功したらRuleの配列を返す。そして、解析失敗の\n// 時はnullではなくエラーメッセージの文字列を返す。\n// 入力が空っぽの時も成功と見なして空の配列を返す。\nfunction rules(input) {\n  inputStr = input;\n  idx = 0;\n  errorMessage = \"\";\n\n  const idxBackup = idx;\n  const rs = [];\n  while (true) {\n    const e = eof();\n    if (e)\n      break; // 正常終了\n    whiteSpace();\n    const r = rule();\n    if (r) {\n      rs.push(r);\n      continue;\n    }\n    // ここまで来たら何かエラー\n    idx = idxBackup;\n    return errorMessage; // rule()の時のエラーを返す\n  }\n  return rs;\n}\n\n\n\n\n//# sourceURL=webpack://SimplePS/./src/parser.js?");

/***/ }),

/***/ "./src/simple-ps.js":
/*!**************************!*\
  !*** ./src/simple-ps.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Engine: () => (/* binding */ Engine),\n/* harmony export */   Rule: () => (/* binding */ Rule),\n/* harmony export */   Term: () => (/* binding */ Term),\n/* harmony export */   Var: () => (/* binding */ Var)\n/* harmony export */ });\n/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parser */ \"./src/parser.js\");\n\n\n//変数\nclass Var {\n  name;\n  constructor(name) {\n    this.name = name;\n  }\n}\n\nclass Term {\n  fun; // 関数名部分\n  args; // 引数部分\n  constructor(fun,args) {\n    this.fun = fun;\n    this.args = args;\n  }\n}\n\nclass Rule {\n  priority; // 優先度\n  lhs; // 条件部(Left hand side)\n  rhs; // 実行部(Right hand side)\n  constructor(priority,lhs,rhs) {\n    this.priority = priority;\n    this.lhs = lhs;\n    this.rhs = rhs;\n  }\n}\n\nclass Engine {\n  constructor(ruleStr) {\n    this.rules = (0,_parser__WEBPACK_IMPORTED_MODULE_0__.rules)(ruleStr);\n  }\n}\n\n\n\n\n//# sourceURL=webpack://SimplePS/./src/simple-ps.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});